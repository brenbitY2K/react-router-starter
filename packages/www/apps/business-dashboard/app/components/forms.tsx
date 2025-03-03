export type ListOfErrors = Array<string | null | undefined> | null | undefined;

export function ErrorList({
  id,
  errors,
}: {
  errors?: ListOfErrors;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className="ml-1 mt-1 flex flex-col gap-1">
      {errorsToRender.map((e) => (
        <li key={e} className="text-destructive text-xs">
          {e}
        </li>
      ))}
    </ul>
  );
}
