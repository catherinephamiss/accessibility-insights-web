// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ResultSectionContent, ResultSectionContentDeps, ResultSectionContentProps } from 'common/components/cards/result-section-content';
import { CardRuleResult } from 'common/types/store-data/card-view-model';
import { shallow } from 'enzyme';
import * as React from 'react';

import { exampleUnifiedRuleResult } from './sample-view-model-data';

describe('ResultSectionContent', () => {
    const emptyRules: CardRuleResult[] = [];
    const someRules: CardRuleResult[] = [exampleUnifiedRuleResult];
    const depsStub = {} as ResultSectionContentDeps;

    it('renders, with some rules', () => {
        const props = {
            deps: depsStub,
            results: someRules,
            outcomeType: 'pass',
        } as ResultSectionContentProps;

        const wrapper = shallow(<ResultSectionContent {...props} />);

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    it('renders, no rules', () => {
        const props: ResultSectionContentProps = {
            deps: depsStub,
            results: emptyRules,
            outcomeType: 'pass',
            showCongratsIfNotInstances: true,
            userConfigurationStoreData: null,
            targetAppInfo: { name: 'app' },
            visualHelperEnabled: true,
            allCardsCollapsed: true,
        };

        const wrapper = shallow(<ResultSectionContent {...props} />);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
