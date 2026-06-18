'use client';
import DCTopbar from './DCTopbar';
import DCPageSidebar from './DCPageSidebar';

interface Props {
  children: React.ReactNode;
  hideSidebar?: boolean;
  noCanvasPadding?: boolean;
  sidebarItems?: Parameters<typeof DCPageSidebar>[0]['items'];
  sidebarLabel?: string;
}

export default function DeliveryClarityShell({ children, hideSidebar, noCanvasPadding, sidebarItems, sidebarLabel }: Props) {
  return (
    <div className="dc-shell">
      <div className="dc-app-window">
        <DCTopbar />
        <div className={hideSidebar ? '' : 'dc-app-body'}>
          {!hideSidebar && <DCPageSidebar items={sidebarItems} label={sidebarLabel} />}
          <main
            className={`dc-page-canvas${noCanvasPadding ? ' dc-page-canvas--no-pad' : ''}`}
            id="main-content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
