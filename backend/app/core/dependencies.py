from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.models.all_models import User
from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        token = request.query_params.get("token")
        
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Eagerly load roles and their permissions to ensure they are available in memory
    user = db.query(User).options(
        joinedload(User.roles).joinedload(User.roles.property.mapper.class_.permissions)
    ).filter(User.id == int(user_id), User.is_active == True).first()
    
    if user is None:
        raise credentials_exception
        
    return user

def require_role(role_name: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.name.lower() for r in current_user.roles]
        if role_name.lower() not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{role_name}' required."
            )
        return current_user
    return dependency

def require_permission(permission_name: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.name.lower())
                
        if permission_name.lower() not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Permission '{permission_name}' required."
            )
        return current_user
    return dependency
def require_institute_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
    
    user_roles = [r.name for r in current_user.roles]
    if "InstituteAdmin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Role 'InstituteAdmin' required."
        )
        
    if not current_user.institute_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User is not scoped to an institute."
        )
        
    return current_user
