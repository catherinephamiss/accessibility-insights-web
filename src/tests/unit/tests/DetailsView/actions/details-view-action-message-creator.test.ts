// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { HeadingsTestStep } from 'assessments/headings/test-steps/test-steps';
import { OnDetailsViewPivotSelected } from 'background/actions/action-payloads';
import { ActionMessageDispatcher } from 'common/message-creators/types/dispatcher';
import { IMock, It, Mock, Times } from 'typemoq';

import {
    AssessmentTelemetryData,
    BaseTelemetryData,
    COPY_ISSUE_DETAILS,
    DETAILS_VIEW_OPEN,
    DetailsViewOpenTelemetryData,
    DetailsViewPivotSelectedTelemetryData,
    EXPORT_RESULTS,
    ExportResultsTelemetryData,
    FeatureFlagToggleTelemetryData,
    RequirementActionTelemetryData,
    RequirementSelectTelemetryData,
    TelemetryEventSource,
    TriggeredByNotApplicable,
} from '../../../../../common/extension-telemetry-events';
import { Message } from '../../../../../common/message';
import { Messages } from '../../../../../common/messages';
import { TelemetryDataFactory } from '../../../../../common/telemetry-data-factory';
import { DetailsViewPivotType } from '../../../../../common/types/details-view-pivot-type';
import { VisualizationType } from '../../../../../common/types/visualization-type';
import { DetailsViewActionMessageCreator } from '../../../../../DetailsView/actions/details-view-action-message-creator';
import { DetailsViewRightContentPanelType } from '../../../../../DetailsView/components/left-nav/details-view-right-content-panel-type';
import { EventStubFactory } from '../../../common/event-stub-factory';

describe('DetailsViewActionMessageCreatorTest', () => {
    const eventStubFactory = new EventStubFactory();
    const testSource: TelemetryEventSource = -1 as TelemetryEventSource;
    let telemetryFactoryMock: IMock<TelemetryDataFactory>;
    let dispatcherMock: IMock<ActionMessageDispatcher>;
    let testSubject: DetailsViewActionMessageCreator;

    beforeEach(() => {
        dispatcherMock = Mock.ofType<ActionMessageDispatcher>();
        telemetryFactoryMock = Mock.ofType(TelemetryDataFactory);
        testSubject = new DetailsViewActionMessageCreator(telemetryFactoryMock.object, dispatcherMock.object);
    });

    test('updateIssuesSelectedTargets', () => {
        const selectedTargets: string[] = ['#headings-1', '#landmark-1'];
        const expectedMessage = {
            messageType: Messages.Visualizations.Issues.UpdateSelectedTargets,
            payload: selectedTargets,
        };

        testSubject.updateIssuesSelectedTargets(selectedTargets);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('updateFocusedInstanceTarget', () => {
        const instanceTarget = ['#headings-1'];
        const expectedMessage = {
            messageType: Messages.Visualizations.Issues.UpdateFocusedInstance,
            payload: instanceTarget,
        };

        testSubject.updateFocusedInstanceTarget(instanceTarget);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('switchToTargetTab', () => {
        const telemetryStub: BaseTelemetryData = {
            triggeredBy: 'mouseclick',
            source: testSource,
        };
        const eventStub = {} as any;
        const expectedMessage: Message = {
            messageType: Messages.Tab.Switch,
            payload: {
                telemetry: telemetryStub,
            },
        };

        setupTelemetryFactory('fromDetailsView', telemetryStub, eventStub);

        testSubject.switchToTargetTab(eventStub);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('selectDetailsView', () => {
        const view = VisualizationType.Headings;
        const event = eventStubFactory.createKeypressEvent() as any;
        const telemetry: DetailsViewOpenTelemetryData = {
            triggeredBy: 'keypress',
            selectedTest: VisualizationType[view],
            source: testSource,
        };
        const pivot = DetailsViewPivotType.allTest;

        const expectedMessage = {
            messageType: Messages.Visualizations.DetailsView.Select,
            payload: {
                telemetry: telemetry,
                detailsViewType: view,
                pivotType: pivot,
            },
        };

        telemetryFactoryMock.setup(tf => tf.forSelectDetailsView(event, view)).returns(() => telemetry);

        testSubject.selectDetailsView(event, VisualizationType.Headings, pivot);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('selectRequirement', () => {
        const view = VisualizationType.Headings;
        const selectedRequirement = HeadingsTestStep.headingFunction;
        const event = eventStubFactory.createKeypressEvent() as any;
        const telemetry: RequirementSelectTelemetryData = {
            triggeredBy: 'keypress',
            selectedTest: VisualizationType[view],
            selectedRequirement: selectedRequirement,
            source: testSource,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.SelectTestRequirement,
            payload: {
                telemetry: telemetry,
                selectedRequirement: selectedRequirement,
                selectedTest: view,
            },
        };

        telemetryFactoryMock.setup(tf => tf.forSelectRequirement(event, view, selectedRequirement)).returns(() => telemetry);

        testSubject.selectRequirement(event, HeadingsTestStep.headingFunction, view);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('setFeatureFlag', () => {
        const event = eventStubFactory.createKeypressEvent() as any;
        const telemetry: FeatureFlagToggleTelemetryData = {
            triggeredBy: 'keypress',
            enabled: true,
            source: testSource,
            featureFlagId: 'test-id',
        };

        const expectedMessage = {
            messageType: Messages.FeatureFlags.SetFeatureFlag,
            payload: {
                feature: 'test-id',
                enabled: true,
                telemetry: telemetry,
            },
        };

        telemetryFactoryMock
            .setup(tf => tf.forFeatureFlagToggle(event, true, TelemetryEventSource.DetailsView, 'test-id'))
            .returns(() => telemetry);

        testSubject.setFeatureFlag('test-id', true, event);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('sendPivotItemClicked', () => {
        const pivot = DetailsViewPivotType.allTest;
        const telemetryData: DetailsViewPivotSelectedTelemetryData = {
            triggeredBy: 'keypress',
            pivotKey: DetailsViewPivotType[pivot],
            source: testSource,
        };

        const payload: OnDetailsViewPivotSelected = {
            telemetry: telemetryData,
            pivotKey: pivot,
        };

        const expectedMessage = {
            messageType: Messages.Visualizations.DetailsView.PivotSelect,
            payload: payload,
        };
        const mouseEventStub = {} as any;

        telemetryFactoryMock
            .setup(tf => tf.forDetailsViewNavPivotActivated(mouseEventStub, DetailsViewPivotType[pivot]))
            .returns(() => telemetryData);

        testSubject.sendPivotItemClicked(DetailsViewPivotType[pivot], mouseEventStub);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('closePreviewFeaturesPanel', () => {
        const telemetry = {
            triggeredBy: TriggeredByNotApplicable,
            source: TelemetryEventSource.DetailsView,
        };

        const expectedMessage = {
            messageType: Messages.PreviewFeatures.ClosePanel,
            payload: {
                telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.closePreviewFeaturesPanel();

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('closeScopingPanel', () => {
        const telemetry = {
            triggeredBy: TriggeredByNotApplicable,
            source: TelemetryEventSource.DetailsView,
        };

        const expectedMessage = {
            messageType: Messages.Scoping.ClosePanel,
            payload: {
                telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.closeScopingPanel();

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('closeSettingsPanel', () => {
        const telemetry = {
            triggeredBy: TriggeredByNotApplicable,
            source: TelemetryEventSource.DetailsView,
        };

        const expectedMessage = {
            messageType: Messages.SettingsPanel.ClosePanel,
            payload: {
                telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.closeSettingsPanel();

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('detailsViewOpened', () => {
        const telemetry = {
            triggeredBy: TriggeredByNotApplicable,
            source: TelemetryEventSource.DetailsView,
            selectedDetailsViewPivot: DetailsViewPivotType[1],
        };

        telemetryFactoryMock.setup(tfm => tfm.forDetailsViewOpened(1)).returns(() => telemetry);

        testSubject.detailsViewOpened(1);

        dispatcherMock.verify(dispatcher => dispatcher.sendTelemetry(DETAILS_VIEW_OPEN, telemetry), Times.once());
    });

    test('startOverAssessment', () => {
        const requirementStub = 'fake-requirement';
        const event = eventStubFactory.createMouseClickEvent() as any;
        const telemetry: AssessmentTelemetryData = {
            triggeredBy: 'mouseclick',
            source: TelemetryEventSource.DetailsView,
            selectedTest: VisualizationType[VisualizationType.HeadingsAssessment],
        };

        const expectedMessage = {
            messageType: Messages.Assessment.StartOver,
            payload: {
                test: VisualizationType.HeadingsAssessment,
                requirement: requirementStub,
                telemetry,
            },
        };

        telemetryFactoryMock
            .setup(tf => tf.forAssessmentActionFromDetailsView(VisualizationType.HeadingsAssessment, event))
            .returns(() => telemetry);

        testSubject.startOverAssessment(event, VisualizationType.HeadingsAssessment, requirementStub);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('continuePreviousAssessment', () => {
        const event = eventStubFactory.createMouseClickEvent() as any;
        const telemetry: BaseTelemetryData = {
            triggeredBy: 'mouseclick',
            source: TelemetryEventSource.DetailsView,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.ContinuePreviousAssessment,
            payload: {
                telemetry,
            },
        };

        telemetryFactoryMock.setup(tf => tf.fromDetailsView(event)).returns(() => telemetry);

        testSubject.continuePreviousAssessment(event);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('startoverAllAssessments', () => {
        const event = eventStubFactory.createMouseClickEvent() as any;
        const telemetry: BaseTelemetryData = {
            triggeredBy: 'mouseclick',
            source: TelemetryEventSource.DetailsView,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.StartOverAllAssessments,
            payload: {
                telemetry,
            },
        };

        telemetryFactoryMock.setup(tf => tf.fromDetailsView(event)).returns(() => telemetry);

        testSubject.startOverAllAssessments(event);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('enableVisualHelper', () => {
        const requirement = 'fake-requirement-name';
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedTest: VisualizationType[VisualizationType.HeadingsAssessment],
        };

        const expectedMessage = {
            messageType: Messages.Assessment.EnableVisualHelper,
            payload: {
                test: VisualizationType.HeadingsAssessment,
                requirement,
                telemetry,
            },
        };
        telemetryFactoryMock
            .setup(tf => tf.forAssessmentActionFromDetailsViewNoTriggeredBy(VisualizationType.HeadingsAssessment))
            .returns(() => telemetry);

        testSubject.enableVisualHelper(VisualizationType.HeadingsAssessment, requirement);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('enableVisualHelper without scan', () => {
        const requirement = 'fake-requirement-name';
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedTest: VisualizationType[VisualizationType.HeadingsAssessment],
        };

        const expectedMessage = {
            messageType: Messages.Assessment.EnableVisualHelperWithoutScan,
            payload: {
                test: VisualizationType.HeadingsAssessment,
                requirement,
                telemetry,
            },
        };

        telemetryFactoryMock
            .setup(tf => tf.forAssessmentActionFromDetailsViewNoTriggeredBy(VisualizationType.HeadingsAssessment))
            .returns(() => telemetry);

        testSubject.enableVisualHelper(VisualizationType.HeadingsAssessment, requirement, false);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('enableVisualHelper, with scan, without telemetry', () => {
        const requirement = 'fake-requirement-name';

        const expectedMessage = {
            messageType: Messages.Assessment.EnableVisualHelper,
            payload: {
                test: VisualizationType.HeadingsAssessment,
                requirement,
                telemetry: null,
            },
        };

        telemetryFactoryMock
            .setup(tf => tf.forAssessmentActionFromDetailsViewNoTriggeredBy(VisualizationType.HeadingsAssessment))
            .returns(() => null);

        testSubject.enableVisualHelper(VisualizationType.HeadingsAssessment, requirement, true, false);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('enableVisualHelper, without scan, without telemetry', () => {
        const requirement = 'fake-requirement-name';

        const expectedMessage = {
            messageType: Messages.Assessment.EnableVisualHelperWithoutScan,
            payload: {
                test: VisualizationType.HeadingsAssessment,
                requirement,
                telemetry: null,
            },
        };

        telemetryFactoryMock
            .setup(tf => tf.forAssessmentActionFromDetailsViewNoTriggeredBy(VisualizationType.HeadingsAssessment))
            .returns(() => null);

        testSubject.enableVisualHelper(VisualizationType.HeadingsAssessment, requirement, false, false);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('disableVisualHelpersForTest', () => {
        const expectedMessage = {
            messageType: Messages.Assessment.DisableVisualHelperForTest,
            payload: {
                test: VisualizationType.HeadingsAssessment,
            },
        };

        testSubject.disableVisualHelpersForTest(VisualizationType.HeadingsAssessment);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('disableVisualHelper', () => {
        const test = -1;
        const requirement = 'requirement';
        const telemetry = {};

        const expectedMessage = {
            messageType: Messages.Assessment.DisableVisualHelper,
            payload: {
                test: test,
                telemetry,
            },
        };

        telemetryFactoryMock
            .setup(tfm => tfm.forRequirementFromDetailsView(test, requirement))
            .returns(() => telemetry as RequirementActionTelemetryData);

        testSubject.disableVisualHelper(test, requirement);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('changeManualTestStatus', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedTest: VisualizationType[1],
            selectedRequirement: 'requirement',
        };

        const expectedMessage = {
            messageType: Messages.Assessment.ChangeStatus,
            payload: {
                test: 1,
                requirement: 'requirement',
                status: 1,
                selector: 'selector',
                telemetry: telemetry,
            },
        };

        telemetryFactoryMock.setup(tfm => tfm.forRequirementFromDetailsView(1, 'requirement')).returns(() => telemetry);

        testSubject.changeManualTestStatus(1, 1, 'requirement', 'selector');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('undoManualTestStatusChange', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedTest: VisualizationType[1],
            selectedRequirement: 'requirement',
        };

        const expectedMessage = {
            messageType: Messages.Assessment.Undo,
            payload: {
                test: 1,
                requirement: 'requirement',
                selector: 'selector',
                telemetry: telemetry,
            },
        };

        telemetryFactoryMock.setup(tfm => tfm.forRequirementFromDetailsView(1, 'requirement')).returns(() => telemetry);

        testSubject.undoManualTestStatusChange(1, 'requirement', 'selector');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('changeManualTestrequirementStatus', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedTest: VisualizationType[1],
            selectedRequirement: 'requirement',
        };

        const expectedMessage = {
            messageType: Messages.Assessment.ChangeRequirementStatus,
            payload: {
                test: 1,
                requirement: 'requirement',
                status: 1,
                telemetry: telemetry,
            },
        };

        telemetryFactoryMock.setup(tfm => tfm.forRequirementFromDetailsView(1, 'requirement')).returns(() => telemetry);

        testSubject.changeManualRequirementStatus(1, 1, 'requirement');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('undoManualRequirementStatusChange', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.UndoChangeRequirementStatus,
            payload: {
                test: 1,
                requirement: 'requirement',
                telemetry: telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.undoManualRequirementStatusChange(1, 'requirement');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('changeAssessmentVisualizationState', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.ChangeVisualizationState,
            payload: {
                test: 1,
                requirement: 'requirement',
                isVisualizationEnabled: true,
                selector: 'selector',
                telemetry: telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.changeAssessmentVisualizationState(true, 1, 'requirement', 'selector');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('addResultDescription', () => {
        const persistedDescription = 'persisted description';
        const expectedMessage = {
            messageType: Messages.Assessment.AddResultDescription,
            payload: {
                description: persistedDescription,
            },
        };

        testSubject.addResultDescription(persistedDescription);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('addPathForValidation', () => {
        const path = 'test path';
        const expectedMessage = {
            messageType: Messages.PathSnippet.AddPathForValidation,
            payload: path,
        };

        testSubject.addPathForValidation(path);
        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('clearPathSnippetData', () => {
        const expectedMessage = {
            messageType: Messages.PathSnippet.ClearPathSnippetData,
        };

        testSubject.clearPathSnippetData();
        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('addFailureInstance', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedRequirement: 'requirement',
            selectedTest: 'test',
        };

        const instanceData = {
            failureDescription: 'description',
            path: 'path',
            snippet: 'snippet',
        };

        const expectedMessage = {
            messageType: Messages.Assessment.AddFailureInstance,
            payload: {
                test: 1,
                requirement: 'requirement',
                instanceData: instanceData,
                telemetry: telemetry,
            },
        };
        telemetryFactoryMock.setup(tf => tf.forRequirementFromDetailsView(1, 'requirement')).returns(() => telemetry);

        testSubject.addFailureInstance(instanceData, 1, 'requirement');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('removeFailureInstance', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
            selectedRequirement: 'requirement',
            selectedTest: 'test',
        };

        const expectedMessage = {
            messageType: Messages.Assessment.RemoveFailureInstance,
            payload: {
                test: 1,
                requirement: 'requirement',
                id: '1',
                telemetry: telemetry,
            },
        };

        telemetryFactoryMock.setup(tf => tf.forRequirementFromDetailsView(1, 'requirement')).returns(() => telemetry);

        testSubject.removeFailureInstance(1, 'requirement', '1');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('editFailureInstance', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
        };

        const instanceData = {
            failureDescription: 'des',
            path: 'path',
            snippet: 'snippet',
        };
        const expectedMessage = {
            messageType: Messages.Assessment.EditFailureInstance,
            payload: {
                test: 1,
                requirement: 'requirement',
                id: '1',
                instanceData: instanceData,
                telemetry: telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.editFailureInstance(instanceData, 1, 'requirement', '1');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('passUnmarkedInstances', () => {
        const test = VisualizationType.Headings;
        const requirement = 'missingHeadings';
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.PassUnmarkedInstances,
            payload: {
                test: test,
                requirement: requirement,
                telemetry: telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.passUnmarkedInstances(test, requirement);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('changeAssessmentVisualizationStateForAll', () => {
        const telemetry = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: TriggeredByNotApplicable,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.ChangeVisualizationStateForAll,
            payload: {
                test: 1,
                requirement: 'requirement',
                isVisualizationEnabled: true,
                selector: null,
                telemetry: telemetry,
            },
        };

        setupTelemetryFactory('fromDetailsViewNoTriggeredBy', telemetry);

        testSubject.changeAssessmentVisualizationStateForAll(true, 1, 'requirement');

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('exportResultsClicked', () => {
        const html = 'html content';
        const event = eventStubFactory.createMouseClickEvent() as any;

        const telemetry: ExportResultsTelemetryData = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: 'mouseclick',
            exportResultsData: 12,
            exportResultsType: 'export result type',
        };

        const exportResultsType = 'Assessment';

        telemetryFactoryMock
            .setup(tf => tf.forExportedHtml(exportResultsType, html, event, TelemetryEventSource.DetailsView))
            .returns(() => telemetry);

        testSubject.exportResultsClicked(exportResultsType, html, event);

        dispatcherMock.verify(dispatcher => dispatcher.sendTelemetry(EXPORT_RESULTS, telemetry), Times.once());
    });

    test('copyIssueDetailsClicked', () => {
        const event = eventStubFactory.createMouseClickEvent() as any;

        const telemetry: BaseTelemetryData = {
            source: TelemetryEventSource.DetailsView,
            triggeredBy: 'mouseclick',
        };

        telemetryFactoryMock.setup(tf => tf.withTriggeredByAndSource(event, TelemetryEventSource.DetailsView)).returns(() => telemetry);

        testSubject.copyIssueDetailsClicked(event);

        dispatcherMock.verify(dispatcher => dispatcher.sendTelemetry(COPY_ISSUE_DETAILS, telemetry), Times.once());
    });

    test('cancelStartOver', () => {
        const event = eventStubFactory.createMouseClickEvent() as any;
        const test = -1;
        const requirement = 'selected requirement';
        const telemetry: RequirementSelectTelemetryData = {
            triggeredBy: 'mouseclick',
            source: TelemetryEventSource.DetailsView,
            selectedTest: 'selected test',
            selectedRequirement: requirement,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.CancelStartOver,
            payload: {
                telemetry,
            },
        };

        telemetryFactoryMock.setup(tf => tf.forCancelStartOver(event, test, requirement)).returns(() => telemetry);

        testSubject.cancelStartOver(event, test, requirement);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('cancelStartOverAssessment', () => {
        const event = eventStubFactory.createMouseClickEvent() as any;
        const telemetry: BaseTelemetryData = {
            triggeredBy: 'mouseclick',
            source: TelemetryEventSource.DetailsView,
        };

        const expectedMessage = {
            messageType: Messages.Assessment.CancelStartOverAllAssessments,
            payload: {
                telemetry,
            },
        };

        telemetryFactoryMock.setup(tf => tf.fromDetailsView(event)).returns(() => telemetry);

        testSubject.cancelStartOverAllAssessments(event);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    test('changeRightContentPanel', () => {
        const viewTypeStub = 'test view type' as DetailsViewRightContentPanelType;
        const expectedMessage = {
            messageType: Messages.Visualizations.DetailsView.SetDetailsViewRightContentPanel,
            payload: viewTypeStub,
        };

        testSubject.changeRightContentPanel(viewTypeStub);

        dispatcherMock.verify(dispatcher => dispatcher.dispatchMessage(It.isValue(expectedMessage)), Times.once());
    });

    function setupTelemetryFactory(methodName: keyof TelemetryDataFactory, telemetry: any, event?: any): void {
        const setupFunc = event ? tfm => tfm[methodName](event) : tfm => tfm[methodName]();
        telemetryFactoryMock.setup(setupFunc).returns(() => telemetry);
    }
});
