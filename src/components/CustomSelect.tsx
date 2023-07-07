import React, { useMemo, useCallback, useRef, Fragment } from 'react'
import { EditableSelect as Select, Label } from '@vkumov/react-cui-2.0'

import { CustomSelectProps, Clicks } from '../types'
import { classNames, sort } from '../utils'
import { DEFAULT_LOCALE_EN } from '../locale'
import { parsePartArray, partToString, formatValue } from '../converter'

const emptyList: number[] = []

export default function CustomSelect(props: CustomSelectProps) {
  const {
    value,
    // grid = true,
    optionsList,
    setValue,
    locale,
    className,
    humanizeLabels,
    disabled,
    readOnly,
    leadingZero,
    clockFormat,
    // period,
    unit,
    ...otherProps
  } = props

  const stringValue = useMemo(() => {
    if (value && Array.isArray(value)) {
      return value.map((value: number) => value.toString())
    }
  }, [value])

  const options = useMemo(
    () => {
      if (optionsList) {
        return optionsList.map((option, index) => {
          const number = unit.min === 0 ? index : index + 1

          return {
            value: number.toString(),
            label: option,
          }
        })
      }

      return [...Array(unit.total)].map((e, index) => {
        const number = unit.min === 0 ? index : index + 1

        return {
          value: number.toString(),
          label: formatValue(
            number,
            unit,
            humanizeLabels,
            leadingZero,
            clockFormat
          ),
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsList, leadingZero, humanizeLabels, clockFormat]
  )

  const localeJSON = JSON.stringify(locale)
  const renderChip = useCallback(
    (props: { onDelete: () => unknown; value: string; idx: number }) => {
      const { value: itemValue } = props

      if (!value || value[0] !== Number(itemValue)) {
        return <Fragment key={itemValue} />
      }

      const parsedArray = parsePartArray(value, unit)
      const cronValue = partToString(
        parsedArray,
        unit,
        humanizeLabels,
        leadingZero,
        clockFormat
      )
      const testEveryValue = cronValue.match(/^\*\/([0-9]+),?/) || []

      return (
        <Label
          color='light'
          size='small'
          key={itemValue}
          className='no-margin-bottom'
        >
          {testEveryValue[1]
            ? `${locale.everyText || DEFAULT_LOCALE_EN.everyText} ${
                testEveryValue[1]
              }`
            : cronValue}
        </Label>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, localeJSON, humanizeLabels, leadingZero, clockFormat]
  )

  const simpleClick = useCallback(
    (newValueOption: number | number[]) => {
      const newValueOptions = Array.isArray(newValueOption)
        ? sort(newValueOption)
        : [newValueOption]
      let newValue: number[] = newValueOptions

      if (value) {
        newValue = [...value]

        newValueOptions.forEach((o) => {
          const newValueOptionNumber = Number(o)

          if (value.some((v) => v === newValueOptionNumber)) {
            newValue = newValue.filter((v) => v !== newValueOptionNumber)
          } else {
            newValue = sort([...newValue, newValueOptionNumber])
          }
        })
      }

      if (newValue.length === unit.total) {
        setValue(emptyList)
      } else {
        setValue(newValue)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue, value]
  )

  const doubleClick = useCallback(
    (newValueOption: number) => {
      if (newValueOption !== 0 && newValueOption !== 1) {
        const limit = unit.total + unit.min
        const newValue: number[] = []

        for (let i = unit.min; i < limit; i++) {
          if (i % newValueOption === 0) {
            newValue.push(i)
          }
        }
        const oldValueEqualNewValue =
          value &&
          newValue &&
          value.length === newValue.length &&
          value.every((v: number, i: number) => v === newValue[i])
        const allValuesSelected = newValue.length === options.length

        if (allValuesSelected) {
          setValue(emptyList)
        } else if (oldValueEqualNewValue) {
          setValue(emptyList)
        } else {
          setValue(newValue)
        }
      } else {
        setValue(emptyList)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, options, setValue]
  )

  const clicksRef = useRef<Clicks[]>([])
  const onOptionClick = useCallback(
    (newValueOption: string) => {
      if (!readOnly) {
        const doubleClickTimeout = 300
        const clicks = clicksRef.current

        clicks.push({
          time: new Date().getTime(),
          value: Number(newValueOption),
        })

        window.setTimeout(() => {
          if (
            clicks.length > 1 &&
            clicks[clicks.length - 1].time - clicks[clicks.length - 2].time <
              doubleClickTimeout
          ) {
            if (
              clicks[clicks.length - 1].value ===
              clicks[clicks.length - 2].value
            ) {
              doubleClick(Number(newValueOption))
            } else {
              simpleClick([
                clicks[clicks.length - 2].value,
                clicks[clicks.length - 1].value,
              ])
            }
          } else {
            simpleClick(Number(newValueOption))
          }

          clicksRef.current = []
        }, doubleClickTimeout)
      }
    },
    [clicksRef, simpleClick, doubleClick, readOnly]
  )

  // Used by the select clear icon
  const onChange = useCallback(
    (newValue: any) => {
      if (!readOnly) {
        if (newValue && newValue.length === 0) {
          setValue(emptyList)
        }
      }
    },
    [setValue, readOnly]
  )

  const internalClassName = useMemo(
    () =>
      classNames({
        'react-js-cron-select': true,
        'react-js-cron-custom-select': true,
        [`${className}-select`]: !!className,
        'qtr-margin-left': true,
        'qtr-margin-bottom': true,
        'qtr-margin-right': true,
      }),
    [className]
  )

  return (
    <Select
      multi
      open={readOnly ? false : undefined}
      value={stringValue}
      onChange={onChange}
      className={internalClassName}
      onSelect={onOptionClick}
      onDeselect={onOptionClick}
      disabled={disabled}
      inline
      renderChip={renderChip}
      displayValues
      {...otherProps}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )
}
