'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomAutocomplete from '@/components/ui/autocomplete';

const departments = ['生産部', '品質保証部', '保全部'];
const groups = ['Aグループ', 'Bグループ'];
const lines = ['ライン1', 'ライン2'];
const machines = ['成形機A', '組立機B'];
const troubles = ['異音発生', '加熱異常'];

type AnalysisModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
};

export function AnalysisModal({
  open,
  onClose,
  onSelectPrompt,
}: AnalysisModalProps) {
  const t = useTranslations('AnalysisModal');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('all');
  const [group, setGroup] = useState('all');
  const [line, setLine] = useState('all');
  const [machine, setMachine] = useState('all');
  const [trouble, setTrouble] = useState('all');
  const [selectedType, setSelectedType] = useState<'summary' | 'analysis'>('summary');

  const buildLabel = (label: string, value: string) => {
    if (!value) return `${label}：${t('unselected')}`;
    if (value === 'all') return `${label}：${t('all')}`;
    return `${label}：${value}`;
  };

  const handleGenerate = () => {
    const dateText = buildLabel(
      t('period'),
      startDate && endDate ? `${startDate}〜${endDate}` : ''
    );
    const groupText = buildLabel(t('group'), group);
    const lineText = buildLabel(t('line'), line);
    const machineText = buildLabel(t('machine'), machine);

    const troubleText =
      !trouble || trouble === 'all'
        ? ''
        : `「${trouble}」${t('analysisSuffix')}`;

    let prompt = '';

    if (selectedType === 'summary') {
      prompt = `${dateText}\n${groupText}\n${lineText}\n${machineText}\n${t('summarySuffix')}`;
    } else {
      prompt = `${dateText}\n${groupText}\n${lineText}\n${machineText}\n${troubleText}`.trim();
    }

    onSelectPrompt(prompt);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 mt-4">
          <div className="w-52 border-r pr-4">
            <p className="text-sm font-semibold mb-2">{t('promptType')}</p>
            <ul className="space-y-2">
              {['summary', 'analysis'].map((type) => (
                <li key={type}>
                  <button
                    className={`w-full text-left px-3 py-1 rounded-md text-sm ${
                      selectedType === type
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedType(type as 'summary' | 'analysis')}
                  >
                    {t(type)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">{t('start')}</label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1">{t('end')}</label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { key: 'department', value: department, set: setDepartment, options: departments },
                { key: 'group', value: group, set: setGroup, options: groups },
                { key: 'line', value: line, set: setLine, options: lines },
                { key: 'machine', value: machine, set: setMachine, options: machines },
                { key: 'trouble', value: trouble, set: setTrouble, options: troubles },
              ].map(({ key, value, set, options }) => {
                const optionList = useMemo(
                  () => [{ label: t('all'), value: 'all' }, ...options.map((o) => ({ label: o, value: o }))],
                  [options, t]
                );

                const selectedOption = useMemo(() => {
                  return optionList.find((opt) => opt.value === value) || optionList[0];
                }, [optionList, value]);

                return (
                  <div key={key}>
                    <label className="text-sm block mb-1">{t(key)}</label>
                    <CustomAutocomplete
                      label={t(key)}
                      placeholder={t('search', { label: t(key) })}
                      width={160}
                      dense
                      options={optionList}
                      value={selectedOption}
                      onChange={(selected) => set(selected?.value || 'all')}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerate}>{t('generate')}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
