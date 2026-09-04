from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.db.database import get_db
from app.models.all_models import User, RefreshToken, Role, Permission
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, UserResponse, UpdatePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    # Find user by username or email (case-insensitive and trimmed)
    identifier = login_data.username_or_email.strip()
    user = db.query(User).filter(
        (func.lower(User.email) == identifier.lower()) | 
        (func.lower(User.username) == identifier.lower())
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    # Role Validation (ensure user is a teacher, admin, instituteadmin, or student)
    user_roles = [r.name.lower() for r in user.roles]
    allowed_login_roles = {"teacher", "admin", "instituteadmin", "student"}
    if not any(r in allowed_login_roles for r in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Account role not authorized for login."
        )
        
    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token_str = create_refresh_token(subject=user.id)
    
    # Store refresh token in DB
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db_refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set HTTP-Only Cookie for additional security
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        max_age=7 * 24 * 3600,
        expires=7 * 24 * 3600,
        samesite="lax",
        secure=False  # Set to True in production over HTTPS
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer"
    }


@router.post("/institute/login", response_model=TokenResponse)
def institute_login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    identifier = login_data.username_or_email.strip()
    user = db.query(User).filter(
        (func.lower(User.email) == identifier.lower()) | 
        (func.lower(User.username) == identifier.lower())
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    user_roles = [r.name.lower() for r in user.roles]
    allowed_roles = {"instituteadmin", "admin", "platformadmin", "teacher"}
    if not any(r in allowed_roles for r in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Institute Admin, Admin, or Teacher accounts can log into this portal."
        )
        
    access_token = create_access_token(subject=user.id)
    refresh_token_str = create_refresh_token(subject=user.id)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db_refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        max_age=7 * 24 * 3600,
        expires=7 * 24 * 3600,
        samesite="lax",
        secure=False
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, refresh_data: Optional[RefreshTokenRequest] = None, db: Session = Depends(get_db)):
    # Try to get token from body or cookie
    token_str = None
    if refresh_data and refresh_data.refresh_token:
        token_str = refresh_data.refresh_token
    else:
        token_str = request.cookies.get("refresh_token")
        
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    # Query database for the token
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_str,
        RefreshToken.revoked == False
    ).first()
    
    if not db_token or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    # Revoke old token
    db_token.revoked = True
    db.commit()
    
    # Generate new tokens
    access_token = create_access_token(subject=db_token.user_id)
    new_refresh_token_str = create_refresh_token(subject=db_token.user_id)
    
    # Store new refresh token in DB
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    new_db_token = RefreshToken(
        token=new_refresh_token_str,
        user_id=db_token.user_id,
        expires_at=new_expires_at
    )
    db.add(new_db_token)
    db.commit()
    
    # Update cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token_str,
        httponly=True,
        max_age=7 * 24 * 3600,
        expires=7 * 24 * 3600,
        samesite="lax",
        secure=False
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token_str,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(request: Request, response: Response, refresh_data: Optional[RefreshTokenRequest] = None, db: Session = Depends(get_db)):
    token_str = None
    if refresh_data and refresh_data.refresh_token:
        token_str = refresh_data.refresh_token
    else:
        token_str = request.cookies.get("refresh_token")
        
    if token_str:
        db_token = db.query(RefreshToken).filter(RefreshToken.token == token_str).first()
        if db_token:
            db_token.revoked = True
            db.commit()
            
    response.delete_cookie("refresh_token")
    return {"detail": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    # Flatten permission names
    permissions = []
    for role in current_user.roles:
        for perm in role.permissions:
            permissions.append(perm.name)
            
    # Remove duplicates
    permissions = list(set(permissions))
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "institute_id": getattr(current_user, "institute_id", None),
        "roles": current_user.roles,
        "permissions": permissions
    }

@router.put("/change-password")
def change_password(data: UpdatePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"detail": "Password updated successfully"}
@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Don't reveal if user exists or not for security
        return {"detail": "If an account with that email exists, a password reset link has been sent."}
        
    # In a real application, generate a secure token, store it in DB with expiry, and email it.
    # For now, we simulate this process.
    reset_token = create_access_token(subject=user.id) # Reusing access token logic as a temporary reset token
    print(f"--- PASSWORD RESET TOKEN FOR {user.email} ---")
    print(reset_token)
    print("---------------------------------------------")
    
    return {"detail": "If an account with that email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        from app.core.security import SECRET_KEY, ALGORITHM
        from jose import jwt, JWTError
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"detail": "Password has been reset successfully"}
