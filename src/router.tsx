import { createBrowserRouter } from 'react-router';
import AppLayout from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import LibraryPage from '@/pages/LibraryPage';
import ReportViewerPage from '@/pages/ReportViewerPage';
import TemplatesPage from '@/pages/TemplatesPage';
import TemplateBuilderPage from '@/pages/TemplateBuilderPage';
import GeneratePage from '@/pages/GeneratePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'library/:reportId', element: <ReportViewerPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'templates/new', element: <TemplateBuilderPage /> },
      { path: 'templates/:id', element: <TemplateBuilderPage /> },
      { path: 'generate', element: <GeneratePage /> },
    ],
  },
]);
