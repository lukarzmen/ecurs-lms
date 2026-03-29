/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {LexicalEditor} from 'lexical';
import * as React from 'react';
import {useState} from 'react';

import Button from '../../ui/Button';
import DropDown, {DropDownItem} from '../../ui/DropDown';
import Switch from '../../ui/Switch';
import TextInput from '../../ui/TextInput';
import {INSERT_LAYOUT_COMMAND} from './LayoutPlugin';
import type {LayoutItemVariant} from '../../nodes/LayoutItemNode';
import {useI18n} from '@/hooks/use-i18n';

export default function InsertLayoutDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const { t } = useI18n();

  const LAYOUTS = [
    {label: t('ed.layoutCol1'), value: '1fr'},
    {label: t('ed.layoutCol2'), value: '1fr 1fr'},
    {label: t('ed.layoutCol2_25_75'), value: '1fr 3fr'},
    {label: t('ed.layoutCol3'), value: '1fr 1fr 1fr'},
    {label: t('ed.layoutCol3_25_50_25'), value: '1fr 2fr 1fr'},
    {label: t('ed.layoutCol4'), value: '1fr 1fr 1fr 1fr'},
  ];

  const MOTIFS: Array<{label: string; value: LayoutItemVariant}> = [
    {label: t('ed.layoutCuriosity'), value: 'default'},
    {label: t('ed.layoutImportant'), value: 'warning'},
  ];

  const [layout, setLayout] = useState(LAYOUTS[0].value);
  const [motif, setMotif] = useState<LayoutItemVariant>(MOTIFS[0].value);
  const [showFrame, setShowFrame] = useState<boolean>(true);
  const [extraLabel, setExtraLabel] = useState<string>('');
  const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label;
  const motifLabel = MOTIFS.find((item) => item.value === motif)?.label;

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, {
      template: layout,
      itemVariant: motif,
      showFrame,
      extraLabel,
    });
    onClose();
  };

  return (
    <>
      <DropDown
        buttonClassName="toolbar-item dialog-dropdown"
        buttonLabel={buttonLabel}>
        {LAYOUTS.map(({label, value}) => (
          <DropDownItem
            key={value}
            className="item"
            onClick={() => setLayout(value)}>
            <span className="text">{label}</span>
          </DropDownItem>
        ))}
      </DropDown>
      <DropDown
        buttonClassName="toolbar-item dialog-dropdown"
        buttonLabel={motifLabel}>
        {MOTIFS.map(({label, value}) => (
          <DropDownItem
            key={value}
            className="item"
            onClick={() => {
              setMotif(value);
            }}>
            <span className="text">{label}</span>
          </DropDownItem>
        ))}
      </DropDown>
      <div className="toolbar-item" style={{padding: '8px 0'}}>
        <Switch
          checked={showFrame}
          onClick={(e) => {
            e.preventDefault();
            setShowFrame((v) => !v);
          }}
          text={t('ed.layoutFrame')}
        />
      </div>
      <div className="toolbar-item" style={{padding: '8px 0'}}>
        <TextInput
          label={t('ed.layoutExtraLabel')}
          value={extraLabel}
          onChange={setExtraLabel}
          placeholder={t('ed.layoutExtraPlaceholder')}
        />
      </div>
      <Button onClick={onClick}>{t('ed.insert')}</Button>
    </>
  );
}
