import { useEffect, useRef, useState } from 'react';
import { Button, Input, Modal } from '@autoparking/ui';
import { orgsStore, type Org } from '../lib/orgsStore';
import { IconBuilding, IconCheck, IconChevron, IconPlus } from './icons';

function Mark({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg bg-primary font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size / 2.6) }}
    >
      {initials || <IconBuilding width={16} height={16} />}
    </span>
  );
}

/** Sidebar organization switcher: current org, a dropdown of the business's
 *  orgs, and an "add company" → leave-a-request (zayavka) flow. */
export function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>(() => orgsStore.list());
  const [current, setCurrentState] = useState<Org>(() => orgsStore.current());
  const [open, setOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '' });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (o: Org) => {
    orgsStore.setCurrent(o.id);
    setCurrentState(o);
    setOpen(false);
  };

  const submitRequest = () => {
    if (!form.name.trim() || !form.contact.trim()) return;
    orgsStore.requestCompany(form.name, form.contact);
    setOrgs(orgsStore.list());
    setDone(true);
  };

  const closeReq = () => {
    setReqOpen(false);
    setDone(false);
    setForm({ name: '', contact: '' });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-2lg border border-gray-200 bg-white px-2.5 py-2 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/40"
      >
        <Mark name={current.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-700">{current.name}</span>
          <span className="block text-exs text-gray-400">Tashkilot</span>
        </span>
        <IconChevron width={16} height={16} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2lg border border-gray-200 bg-white shadow-card">
          <div className="px-2 py-1.5 text-exs font-medium uppercase tracking-wide text-gray-400">
            Tashkilotlar
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {orgs.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => pick(o)}
                  className="flex w-full items-center gap-2.5 px-2 py-2 text-left transition-colors hover:bg-gray-100"
                >
                  <Mark name={o.name} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{o.name}</span>
                  {o.id === current.id && <IconCheck width={16} height={16} className="text-primary" />}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setReqOpen(true);
            }}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-50"
          >
            <IconPlus width={16} height={16} />
            Kompaniya qo‘shish
          </button>
        </div>
      )}

      <Modal show={reqOpen} title="Yangi kompaniya" size="sm" onClose={closeReq}>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-600">
              <IconCheck width={26} height={26} />
            </span>
            <div className="text-sm font-semibold text-gray-700">Zayavka qabul qilindi</div>
            <p className="text-2xs text-gray-500">
              Tez orada operatorlarimiz siz bilan bog‘lanadi.
            </p>
            <Button variant="primary" onClick={closeReq}>
              Yopish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-2xs text-gray-500">
              Yangi tashkilot qo‘shish uchun zayavka qoldiring — biz bog‘lanamiz.
            </p>
            <Input
              label="Kompaniya nomi"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Aloqa (telefon yoki email)"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={closeReq}>
                Bekor
              </Button>
              <Button variant="primary" onClick={submitRequest}>
                Zayavka qoldirish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
