import Link from "next/link";

export function FilterSelect({
  id,
  name,
  label,
  value,
  options,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[150px]">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={value} className="field">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterBar({
  action,
  resetHref,
  keyword,
  keywordLabel,
  keywordPlaceholder,
  sort,
  dir,
  children,
}: {
  action: string;
  resetHref: string;
  keyword: string;
  keywordLabel: string;
  keywordPlaceholder: string;
  sort?: string;
  dir?: string;
  children: React.ReactNode;
}) {
  return (
    <form method="get" action={action} className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-[200px] flex-1">
        <label htmlFor="filter-keyword" className="label">
          {keywordLabel}
        </label>
        <input
          id="filter-keyword"
          name="q"
          type="search"
          defaultValue={keyword}
          placeholder={keywordPlaceholder}
          className="field"
        />
      </div>
      {children}
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}
      {dir ? <input type="hidden" name="dir" value={dir} /> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-navy btn-sm">
          Apply filters
        </button>
        <Link href={resetHref} className="btn btn-ghost btn-sm">
          Reset
        </Link>
      </div>
    </form>
  );
}
