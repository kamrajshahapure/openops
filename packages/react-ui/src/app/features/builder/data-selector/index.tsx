import { cn, Input, ScrollArea } from '@openops/components/ui';
import { t } from 'i18next';
import { SearchXIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { textMentionUtils } from '@/app/features/builder/block-properties/text-input-with-mentions/text-input-utils';
import { Action, flowHelper, isNil, Trigger } from '@openops/shared';

import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';
import { dataSelectorUtils, MentionTreeNode } from './data-selector-utils';

const createTestNode = (
  step: Action | Trigger,
  displayName: string,
): MentionTreeNode => {
  return {
    key: step.name,
    data: {
      displayName,
      propertyPath: step.name,
    },
    children: [
      {
        data: {
          displayName: displayName,
          propertyPath: step.name,
          isTestStepNode: true,
        },
        key: `test_${step.name}`,
      },
    ],
  };
};

function filterBy(arr: MentionTreeNode[], query: string): MentionTreeNode[] {
  if (!query) {
    return arr;
  }

  return arr.reduce((acc, item) => {
    const isTestNode =
      !isNil(item.children) && item?.children?.[0]?.data?.isTestStepNode;
    if (isTestNode) {
      return acc;
    }

    if (item.children?.length) {
      const filteredChildren = filterBy(item.children, query);
      if (filteredChildren.length) {
        acc.push({ ...item, children: filteredChildren });
        return acc; // return acc as we have handled this item
      }
    }

    const normalizedValue = item?.data?.value;
    const value = isNil(normalizedValue)
      ? ''
      : JSON.stringify(normalizedValue).toLowerCase();
    const displayName = item?.data?.displayName?.toLowerCase();

    if (
      displayName?.includes(query.toLowerCase()) ||
      value.includes(query.toLowerCase())
    ) {
      acc.push({ ...item, children: undefined });
    }

    return acc; // Always return acc
  }, [] as MentionTreeNode[]);
}
const getAllStepsMentions: (state: BuilderState) => MentionTreeNode[] = (
  state,
) => {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return [];
  }
  const pathToTargetStep = flowHelper.findPathToStep({
    targetStepName: selectedStep,
    trigger: flowVersion.trigger,
  });

  return pathToTargetStep.map((step) => {
    const stepNeedsTesting = isNil(step.settings.inputUiInfo?.lastTestDate);
    const displayName = `${step.dfsIndex + 1}. ${step.displayName}`;
    if (stepNeedsTesting) {
      return createTestNode(step, displayName);
    }
    return dataSelectorUtils.traverseStepOutputAndReturnMentionTree({
      stepOutput: step.settings.inputUiInfo?.currentSelectedData,
      propertyPath: step.name,
      displayName: displayName,
    });
  });
};

type DataSelectorProps = {
  parentHeight: number;
  parentWidth: number;
};

const doesHaveInputThatUsesMentionClass = (
  element: Element | null,
): boolean => {
  if (isNil(element)) {
    return false;
  }
  if (element.classList.contains(textMentionUtils.inputThatUsesMentionClass)) {
    return true;
  }
  const parent = element.parentElement;
  if (parent) {
    return doesHaveInputThatUsesMentionClass(parent);
  }
  return false;
};

const DataSelector = ({ parentHeight, parentWidth }: DataSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [DataSelectorSize, setDataSelectorSize] =
    useState<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);
  const [searchTerm, setSearchTerm] = useState('');
  const mentions = useBuilderStateContext(getAllStepsMentions);
  const filteredMentions = filterBy(structuredClone(mentions), searchTerm);
  const [showDataSelector, setShowDataSelector] = useState(false);

  const checkFocus = useCallback(() => {
    const isTextMentionInputFocused =
      (!isNil(containerRef.current) &&
        containerRef.current.contains(document.activeElement)) ||
      doesHaveInputThatUsesMentionClass(document.activeElement);

    setShowDataSelector(isTextMentionInputFocused);
  }, []);

  useEffect(() => {
    document.addEventListener('focusin', checkFocus);
    document.addEventListener('focusout', checkFocus);

    return () => {
      document.removeEventListener('focusin', checkFocus);
      document.removeEventListener('focusout', checkFocus);
    };
  }, [checkFocus]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'absolute bottom-[0px]  mr-5 mb-5  right-[0px]  z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'opacity-0 pointer-events-none': !showDataSelector,
        },
      )}
    >
      <div className="text-lg items-center font-semibold px-5 py-2 flex gap-2">
        {t('Data Selector')} <div className="flex-grow"></div>{' '}
        <DataSelectorSizeTogglers
          state={DataSelectorSize}
          setListSizeState={setDataSelectorSize}
        ></DataSelectorSizeTogglers>
      </div>
      <div
        style={{
          height:
            DataSelectorSize === DataSelectorSizeState.COLLAPSED
              ? '0px'
              : DataSelectorSize === DataSelectorSizeState.DOCKED
              ? '450px'
              : `${parentHeight - 100}px`,
          width:
            DataSelectorSize !== DataSelectorSizeState.EXPANDED
              ? '450px'
              : `${parentWidth - 40}px`,
        }}
        className="transition-all overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-2">
          <Input
            placeholder={t('Search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          ></Input>
        </div>

        <ScrollArea className="transition-all h-[calc(100%-56px)] w-full ">
          {filteredMentions &&
            filteredMentions.map((node) => (
              <DataSelectorNode
                depth={0}
                key={node.key}
                node={node}
                searchTerm={searchTerm}
              ></DataSelectorNode>
            ))}
          {filteredMentions.length === 0 && (
            <div className="flex items-center justify-center gap-2 mt-5  flex-col">
              <SearchXIcon className="w-[35px] h-[35px]"></SearchXIcon>
              <div className="text-center font-semibold text-md">
                {t('No matching data')}
              </div>
              <div className="text-center ">
                {t('Try adjusting your search')}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

DataSelector.displayName = 'DataSelector';
export { DataSelector };
