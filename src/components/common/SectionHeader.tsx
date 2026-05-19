type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

