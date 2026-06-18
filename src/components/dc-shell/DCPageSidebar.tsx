'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DC_NAV_GROUPS, type DCShellNavItem } from './navigation';

interface Props {
  items?: DCShellNavItem[];
  label?: string;
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

export default function DCPageSidebar({ items, label }: Props) {
  const pathname = usePathname();
  const customGroups = items ? [{ id: 'custom', label: label ?? 'Navigation', items }] : null;
  const groups = customGroups ?? DC_NAV_GROUPS;
  let itemIndex = 0;

  return (
    <aside className="dc-sidebar" aria-label="Page navigation">
      <p style={{
        fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
        color: 'var(--dc-text-3)', textTransform: 'uppercase',
        marginBottom: 12, paddingLeft: 10, margin: '0 0 12px 0',
      }}>
        Navigation
      </p>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(group => (
          <section key={group.id} className="dc-side-group" aria-labelledby={`dc-side-${group.id}`}>
            <p id={`dc-side-${group.id}`} className="dc-side-group-label">{group.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
                itemIndex += 1;
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`dc-side-item${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="dc-side-num">{String(itemIndex).padStart(2, '0')}</span>
                    <span>
                      <span className="dc-side-title" style={{ display: 'block' }}>{item.title}</span>
                      <span className="dc-side-desc">{item.desc}</span>
                    </span>
                    <span className={`dc-dot ${item.status}`} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
