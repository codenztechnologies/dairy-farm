import { useState } from 'react';
import {
  Button,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DatePicker,
  Dialog,
  Field,
  FileUpload,
  MoneyInput,
  MultiSelect,
  NumberInput,
  PhoneInput,
  RadioPills,
  Select,
  Sheet,
  Switch,
  TimePicker,
  toast,
  type ComboOption,
} from '..';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = { title: 'Inputs/Controls and overlays' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const ANIMALS: readonly ComboOption[] = [
  { value: 'a1', label: 'PK-1042 Rani', hint: 'Lactating herd' },
  { value: 'a2', label: 'PK-1049 Lali', hint: 'Dry cows' },
];

export const Controls: Story = {
  render: () => {
    const [group, setGroup] = useState<string | undefined>();
    const [sex, setSex] = useState<string | undefined>('female');
    const [price, setPrice] = useState('120.50');
    const [weight, setWeight] = useState('412.5');
    const [sold, setSold] = useState(false);
    const [daily, setDaily] = useState(true);
    return (
      <div className="grid max-w-3xl gap-5 md:grid-cols-2">
        <Field label="Group" required>
          <Select
            value={group}
            onValueChange={setGroup}
            placeholder="Choose a group"
            options={[
              { value: 'dry', label: 'Dry cows' },
              { value: 'lactating', label: 'Lactating herd' },
            ]}
          />
        </Field>
        <Field label="Sex">
          <RadioPills
            label="Sex"
            value={sex}
            onValueChange={setSex}
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
            ]}
          />
        </Field>
        <Field label="Price per litre">
          <MoneyInput currency="Rs" value={price} onValueChange={setPrice} />
        </Field>
        <Field label="Weight">
          <NumberInput value={weight} onValueChange={setWeight} trailing="kg" />
        </Field>
        <Checkbox checked={sold} onCheckedChange={setSold} label="Include sold animals" />
        <Switch checked={daily} onCheckedChange={setDaily} label="Daily WhatsApp summary" />
      </div>
    );
  },
};

export const Pickers: Story = {
  render: () => {
    const [date, setDate] = useState<string | undefined>();
    const [time, setTime] = useState('06:30');
    const [phone, setPhone] = useState('');
    const [animal, setAnimal] = useState<string | undefined>();
    const [groups, setGroups] = useState<string[]>(['a1']);
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div className="grid max-w-3xl gap-5 md:grid-cols-2">
        <Field label="Last calving date">
          <DatePicker value={date} onValueChange={setDate} placeholder="Choose a date" />
        </Field>
        <Field label="Milking time">
          <TimePicker value={time} onValueChange={setTime} />
        </Field>
        <Field label="Mobile number">
          <PhoneInput value={phone} onValueChange={setPhone} />
        </Field>
        <Field label="Animal">
          <Combobox
            value={animal}
            onValueChange={setAnimal}
            placeholder="Choose an animal"
            searchPlaceholder="Search by tag or name"
            options={ANIMALS}
          />
        </Field>
        <Field label="Animals" className="md:col-span-2">
          <MultiSelect
            value={groups}
            onValueChange={setGroups}
            placeholder="Choose animals"
            searchPlaceholder="Search"
            options={ANIMALS}
          />
        </Field>
        <Field label="Photos" className="md:col-span-2">
          <FileUpload files={files} onFilesChange={setFiles} accept="image/*" maxFiles={4} />
        </Field>
      </div>
    );
  },
};

export const Overlays: Story = {
  render: () => {
    const [dialog, setDialog] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [sheet, setSheet] = useState(false);
    return (
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setDialog(true);
          }}
        >
          Open dialog
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setConfirm(true);
          }}
        >
          Delete animal
        </Button>
        <Button
          onClick={() => {
            setSheet(true);
          }}
        >
          Open side panel
        </Button>
        <Button
          onClick={() => {
            toast({ title: 'Animal PK-1042 saved', description: 'Added to the Dry group.' });
          }}
        >
          Show toast
        </Button>
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          title="Add a note"
          description="Visible to everyone with access to this animal."
          footer={
            <Button
              variant="primary"
              onClick={() => {
                setDialog(false);
              }}
            >
              Save
            </Button>
          }
        />
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Delete animal PK-1042?"
          description="This removes the animal from your herd lists. Its milk records are kept."
          confirmLabel="Delete animal"
          onConfirm={() => {
            setConfirm(false);
          }}
        />
        <Sheet
          open={sheet}
          onOpenChange={setSheet}
          title="Animal PK-1042"
          description="Details open in a side panel so the list stays visible."
        >
          <p>Panel content</p>
        </Sheet>
      </div>
    );
  },
};
