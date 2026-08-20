import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';

export const PlaceholderPage: React.FC = () => {
  const { pathname } = useLocation();

  // Helper to format segments: '/learning-manager/live-classes' -> ['Learning Manager', 'Live Classes']
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) =>
      seg
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );

  const moduleName = segments[0] || 'Module';
  const subModuleName = segments[1] || '';

  // Breadcrumbs items
  const breadcrumbItems = segments.map((seg, idx) => {
    const path = '/' + pathname.split('/').filter(Boolean).slice(0, idx + 1).join('/');
    return {
      label: seg,
      path: idx === segments.length - 1 ? undefined : path,
    };
  });

  // Example tabs if the page matches Settings or OnDomain settings
  const [activeTab, setActiveTab] = useState('general');
  const isSettings = pathname.includes('/settings');
  const isOnDomain = pathname.includes('/on-domain-settings');

  const settingsTabs = [
    { id: 'general', label: 'General Configuration' },
    { id: 'security', label: 'Security & Keys' },
    { id: 'advanced', label: 'Advanced Settings' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={subModuleName || moduleName}
        description={`Manage the features and settings for the ${subModuleName || moduleName} sub-module.`}
        breadcrumbs={<Breadcrumb items={breadcrumbItems} />}
      />

      {(isSettings || isOnDomain) && (
        <Tabs
          items={settingsTabs}
          activeId={activeTab}
          onChange={setActiveTab}
          variant="underline"
          className="mb-4"
        />
      )}

      <Card>
        <CardContent className="p-8">
          <EmptyState
            title="Module Scaffolding Ready"
            description={`The page layout and routing for "${subModuleName || moduleName}" (Route: ${pathname}) have been initialized. Individual functional workflows will be implemented in the subsequent phase.`}
            icon={<Wrench className="h-6 w-6 text-violet-400" />}
            actionLabel="Back to Dashboard"
            onActionClick={() => {
              window.location.hash = '#/dashboard'; // support fallback or standard navigation
              window.location.pathname = '/dashboard';
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
export default PlaceholderPage;
