// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { CardsCollapsibleControl, CollapsibleComponentCardsProps } from 'common/components/cards/collapsible-component-cards';
import { CardSelectionMessageCreator } from 'common/message-creators/card-selection-message-creator';
import { shallow } from 'enzyme';
import { forOwn } from 'lodash';
import * as React from 'react';
import { IMock, It, Mock, Times } from 'typemoq';

describe('CollapsibleComponentCardsTest', () => {
    let cardSelectionMessageCreatorMock: IMock<CardSelectionMessageCreator>;
    const optionalPropertiesObject = {
        contentClassName: [undefined, 'content-class-name-a'],
        containerClassName: [undefined, 'a-container'],
        buttonAriaLabel: [undefined, 'some button label'],
    };

    beforeEach(() => {
        cardSelectionMessageCreatorMock = Mock.ofType(CardSelectionMessageCreator);
    });

    forOwn(optionalPropertiesObject, (propertyValues, propertyName) => {
        propertyValues.forEach(value => {
            test(`render with ${propertyName} set to: ${value}`, () => {
                cardSelectionMessageCreatorMock
                    .setup(mock => mock.toggleRuleExpandCollapse(It.isAnyString(), It.isAny()))
                    .verifiable(Times.never());

                const props: CollapsibleComponentCardsProps = {
                    header: <div>Some header</div>,
                    content: <div>Some content</div>,
                    headingLevel: 5,
                    [propertyName]: value,
                    deps: { cardSelectionMessageCreator: cardSelectionMessageCreatorMock.object },
                    isExpanded: true,
                };
                const control = CardsCollapsibleControl(props);
                const result = shallow(control);
                expect(result.getElement()).toMatchSnapshot();
                cardSelectionMessageCreatorMock.verifyAll();
            });
        });
    });

    test('toggle from expanded to collapsed', () => {
        const eventStub = {} as React.SyntheticEvent;
        cardSelectionMessageCreatorMock.setup(mock => mock.toggleRuleExpandCollapse(It.isAnyString(), eventStub)).verifiable(Times.once());

        const props: CollapsibleComponentCardsProps = {
            header: <div>Some header</div>,
            content: <div>Some content</div>,
            headingLevel: 5,
            deps: {
                cardSelectionMessageCreator: cardSelectionMessageCreatorMock.object,
            },
            isExpanded: true,
            id: 'test-id',
        };
        const control = CardsCollapsibleControl(props);
        const result = shallow(control);
        expect(result.getElement()).toMatchSnapshot('expanded');

        const button = result.find('CustomizedActionButton');
        button.simulate('click', eventStub);
        expect(result.getElement()).toMatchSnapshot('collapsed');

        cardSelectionMessageCreatorMock.verifyAll();
    });
});
