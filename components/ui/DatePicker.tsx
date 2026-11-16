"use client";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { DatePicker as AriaDatePicker, DateInput, DateSegment } from "react-aria-components/DatePicker";
import { Calendar, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, CalendarHeading } from "react-aria-components/Calendar";
import { Button } from "react-aria-components/Button";
import { Dialog } from "react-aria-components/Dialog";
import { FieldError } from "react-aria-components/FieldError";
import { Group } from "react-aria-components/Group";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { Label } from "react-aria-components/Label";
import { Popover } from "react-aria-components/Popover";
import { Text } from "react-aria-components/Text";

// The date field on the setup wizards, after the React Aria Components starter
// DatePicker (label, segmented date input with a calendar button, description, error,
// and a calendar in a popover). Plain CSS instead of Tailwind; an inline icon instead
// of lucide-react. Dates are typed or picked day / month / year, as written in Nigeria.
// The value in and out is the same "YYYY-MM-DD" string the forms already store.

const toDate = (s: string): CalendarDate | null => { try { return s ? parseDate(s) : null; } catch { return null; } };

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);
const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
  </svg>
);

export default function DatePicker({ id, label, value, onChange, description, errorMessage }: {
  id?: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  description?: string;
  errorMessage?: string;
}) {
  return (
    <I18nProvider locale="en-GB">
      <AriaDatePicker
        id={id}
        className="field dp"
        value={toDate(value)}
        onChange={(d) => onChange(d ? d.toString() : "")}
        shouldForceLeadingZeros
      >
        <Label>{label}</Label>
        <Group className="pit dp-group">
          <DateInput className="dp-input">{(seg) => <DateSegment segment={seg} className="dp-seg" />}</DateInput>
          <Button className="dp-btn"><CalendarIcon /></Button>
        </Group>
        {description && <Text slot="description" className="hint">{description}</Text>}
        <FieldError className="err">{errorMessage}</FieldError>
        {/* The popover renders at the end of <body>, outside the wizard, so it carries the theme itself. */}
        <Popover className="ob dp-pop" placement="bottom end" offset={8}>
          <Dialog className="dp-dialog" aria-label={label}>
            <Calendar className="dp-cal">
              <header className="dp-head">
                <Button slot="previous" className="dp-nav"><Chevron dir="left" /></Button>
                <CalendarHeading className="dp-title" />
                <Button slot="next" className="dp-nav"><Chevron dir="right" /></Button>
              </header>
              <CalendarGrid className="dp-grid">
                <CalendarGridHeader>{(day) => <CalendarHeaderCell className="dp-dow">{day}</CalendarHeaderCell>}</CalendarGridHeader>
                <CalendarGridBody>{(date) => <CalendarCell date={date} className="dp-cell" />}</CalendarGridBody>
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </AriaDatePicker>
    </I18nProvider>
  );
}
