"use client";
// Select: a dropdown in the shadcn/ui "Select" format (a trigger with a chevron; a list
// in a floating card, an optional group label, a check beside the chosen item, the
// item under the pointer or keyboard highlighted). Built on react-aria-components (already
// a dependency, as in DatePicker) instead of Radix, with plain CSS (.sel-* in globals.css)
// instead of Tailwind, and inline icons instead of lucide. react-aria gives it the listbox
// semantics, typeahead, arrow keys, Escape and focus return.
// The trigger keeps the setup wizard's field look (.in inside .pit, with the focus dot).
import { Button } from "react-aria-components/Button";
import { ListBox, ListBoxItem, ListBoxSection, Popover, Select as AriaSelect, SelectValue } from "react-aria-components/Select";
import { Header } from "react-aria-components/ListBox";

export type SelectOption = { id: string; label: string };

type Props = {
  "aria-label": string;
  value: string;
  onChange: (id: string) => void;
  options: SelectOption[];
  /** A small heading over the list (like shadcn's SelectLabel). */
  groupLabel?: string;
  isDisabled?: boolean;
};

const Chevron = () => (
  <svg className="sel-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const Check = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

export default function Select({ "aria-label": label, value, onChange, options, groupLabel, isDisabled }: Props) {
  const items = options.map((o) => (
    <ListBoxItem key={o.id} id={o.id} textValue={o.label} className="sel-item">
      {({ isSelected }) => (<><span className="sel-check">{isSelected && <Check />}</span>{o.label}</>)}
    </ListBoxItem>
  ));
  return (
    <AriaSelect aria-label={label} value={value} onChange={(k) => k != null && onChange(String(k))} isDisabled={isDisabled} className="sel">
      <span className="pit">
        <Button className="in sel-trigger"><SelectValue className="sel-value" /><Chevron /></Button>
      </span>
      {/* The popover renders at the end of <body>, outside the wizard, so it carries the theme itself. */}
      <Popover className="ob sel-pop" placement="bottom start" offset={6}>
        <ListBox className="sel-list">
          {groupLabel ? <ListBoxSection><Header className="sel-label">{groupLabel}</Header>{items}</ListBoxSection> : items}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
