// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { shallow } from 'enzyme';
import * as React from 'react';

import { AutomatedChecksCommandBar } from 'DetailsView/components/automated-checks-command-bar';
import { CommandBarProps, DetailsViewCommandBarProps } from 'DetailsView/components/details-view-command-bar';
import { DetailsViewSwitcherNavConfiguration } from 'DetailsView/components/details-view-switcher-nav';

function getProps(): CommandBarProps {
    const switcherNavConfiguration: DetailsViewSwitcherNavConfiguration = ({
        ReportExportComponentPropertyFactory: (p: DetailsViewCommandBarProps) => null,
        StartOverComponentPropertyFactory: (p: DetailsViewCommandBarProps) => null,
    } as unknown) as DetailsViewSwitcherNavConfiguration;

    const props = {
        switcherNavConfiguration: switcherNavConfiguration,
    } as CommandBarProps;

    return props;
}

describe('getAutomatedChecksCommandBar ', () => {
    it('should return DetailsViewCommandBar with deps of reportExportComponentPropertyFactory and startOverComponentPropertyFactory', () => {
        const props = getProps();
        const actual = shallow(<AutomatedChecksCommandBar {...props} />);

        expect(actual.getElement()).toMatchSnapshot();
    });
});
