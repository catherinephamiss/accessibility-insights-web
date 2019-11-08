// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AppInsights } from 'applicationinsights-js';
import axios from 'axios';
import { CardSelectionActionCreator } from 'background/actions/card-selection-action-creator';
import { CardSelectionActions } from 'background/actions/card-selection-actions';
import { UnifiedScanResultActions } from 'background/actions/unified-scan-result-actions';
import { registerUserConfigurationMessageCallback } from 'background/global-action-creators/registrar/register-user-configuration-message-callbacks';
import { UserConfigurationActionCreator } from 'background/global-action-creators/user-configuration-action-creator';
import { Interpreter } from 'background/interpreter';
import { CardSelectionStore } from 'background/stores/card-selection-store';
import { UnifiedScanResultStore } from 'background/stores/unified-scan-result-store';
import { onlyHighlightingSupported } from 'common/components/cards/card-interaction-support';
import { CardsCollapsibleControl } from 'common/components/cards/collapsible-component-cards';
import { getPropertyConfiguration } from 'common/configs/unified-result-property-configurations';
import { DateProvider } from 'common/date-provider';
import { getCardSelectionViewData } from 'common/get-card-selection-view-data';
import { GetGuidanceTagsFromGuidanceLinks } from 'common/get-guidance-tags-from-guidance-links';
import { CardSelectionMessageCreator } from 'common/message-creators/card-selection-message-creator';
import { UserConfigMessageCreator } from 'common/message-creators/user-config-message-creator';
import { getCardViewData } from 'common/rule-based-view-model-provider';
import { CardsViewDeps } from 'DetailsView/components/cards-view';
import { remote } from 'electron';
import { DirectActionMessageDispatcher } from 'electron/adapters/direct-action-message-dispatcher';
import { createGetToolDataDelegate } from 'electron/common/application-properties-provider';
import { ScanActionCreator } from 'electron/flux/action-creator/scan-action-creator';
import { WindowFrameActionCreator } from 'electron/flux/action-creator/window-frame-action-creator';
import { WindowStateActionCreator } from 'electron/flux/action-creator/window-state-action-creator';
import { ScanActions } from 'electron/flux/action/scan-actions';
import { WindowFrameActions } from 'electron/flux/action/window-frame-actions';
import { WindowStateActions } from 'electron/flux/action/window-state-actions';
import { ScanStore } from 'electron/flux/store/scan-store';
import { WindowStateStore } from 'electron/flux/store/window-state-store';
import { createFetchScanResults } from 'electron/platform/android/fetch-scan-results';
import { ScanController } from 'electron/platform/android/scan-controller';
import { createDefaultBuilder } from 'electron/platform/android/unified-result-builder';
import { RootContainerProps, RootContainerState } from 'electron/views/root-container/components/root-container';
import { PlatformInfo } from 'electron/window-management/platform-info';
import { WindowFrameListener } from 'electron/window-management/window-frame-listener';
import { WindowFrameUpdater } from 'electron/window-management/window-frame-updater';
import { FixInstructionProcessor } from 'injected/fix-instruction-processor';
import * as ReactDOM from 'react-dom';

import { UserConfigurationActions } from '../../background/actions/user-configuration-actions';
import { getPersistedData, PersistedData } from '../../background/get-persisted-data';
import { IndexedDBDataKeys } from '../../background/IndexedDBDataKeys';
import { InstallationData } from '../../background/installation-data';
import { UserConfigurationStore } from '../../background/stores/global/user-configuration-store';
import { getTelemetryClient } from '../../background/telemetry/telemetry-client-provider';
import { TelemetryEventHandler } from '../../background/telemetry/telemetry-event-handler';
import { TelemetryLogger } from '../../background/telemetry/telemetry-logger';
import { TelemetryStateListener } from '../../background/telemetry/telemetry-state-listener';
import { initializeFabricIcons } from '../../common/fabric-icons';
import { getIndexedDBStore } from '../../common/indexedDB/get-indexeddb-store';
import { IndexedDBAPI, IndexedDBUtil } from '../../common/indexedDB/indexedDB';
import { BaseClientStoresHub } from '../../common/stores/base-client-stores-hub';
import { androidAppTitle } from '../../content/strings/application';
import { ElectronAppDataAdapter } from '../adapters/electron-app-data-adapter';
import { ElectronStorageAdapter } from '../adapters/electron-storage-adapter';
import { RiggedFeatureFlagChecker } from '../common/rigged-feature-flag-checker';
import { DeviceConnectActionCreator } from '../flux/action-creator/device-connect-action-creator';
import { DeviceActions } from '../flux/action/device-actions';
import { DeviceStore } from '../flux/store/device-store';
import { ElectronLink } from './device-connect-view/components/electron-link';
import { sendAppInitializedTelemetryEvent } from './device-connect-view/send-app-initialized-telemetry';
import { RootContainerRenderer } from './root-container/root-container-renderer';
import { screenshotViewModelProvider } from './screenshot/screenshot-view-model-provider';

initializeFabricIcons();

const indexedDBInstance: IndexedDBAPI = new IndexedDBUtil(getIndexedDBStore());

const userConfigActions = new UserConfigurationActions();
const deviceActions = new DeviceActions();
const windowFrameActions = new WindowFrameActions();
const windowStateActions = new WindowStateActions();
const scanActions = new ScanActions();
const unifiedScanResultActions = new UnifiedScanResultActions();
const cardSelectionActions = new CardSelectionActions();

const storageAdapter = new ElectronStorageAdapter(indexedDBInstance);
const appDataAdapter = new ElectronAppDataAdapter();

const indexedDBDataKeysToFetch = [IndexedDBDataKeys.userConfiguration, IndexedDBDataKeys.installation];

// tslint:disable-next-line:no-floating-promises - top-level entry points are intentionally floating promises
getPersistedData(indexedDBInstance, indexedDBDataKeysToFetch).then((persistedData: Partial<PersistedData>) => {
    const installationData: InstallationData = persistedData.installationData;

    const telemetryLogger = new TelemetryLogger();
    telemetryLogger.initialize(new RiggedFeatureFlagChecker());

    const telemetryClient = getTelemetryClient(
        androidAppTitle,
        installationData,
        appDataAdapter,
        telemetryLogger,
        AppInsights,
        storageAdapter,
    );
    const telemetryEventHandler = new TelemetryEventHandler(telemetryClient);

    const userConfigurationStore = new UserConfigurationStore(persistedData.userConfigurationData, userConfigActions, indexedDBInstance);
    userConfigurationStore.initialize();

    const deviceStore = new DeviceStore(deviceActions);
    deviceStore.initialize();

    const windowStateStore = new WindowStateStore(windowStateActions);
    windowStateStore.initialize();

    const unifiedScanResultStore = new UnifiedScanResultStore(unifiedScanResultActions);
    unifiedScanResultStore.initialize();

    const scanStore = new ScanStore(scanActions);
    scanStore.initialize();

    const cardSelectionStore = new CardSelectionStore(cardSelectionActions, unifiedScanResultActions);
    cardSelectionStore.initialize();

    const currentWindow = remote.getCurrentWindow();
    const windowFrameUpdater = new WindowFrameUpdater(windowFrameActions, currentWindow);
    windowFrameUpdater.initialize();

    const storeHub = new BaseClientStoresHub<RootContainerState>([
        userConfigurationStore,
        deviceStore,
        windowStateStore,
        scanStore,
        unifiedScanResultStore,
        cardSelectionStore,
    ]);

    const telemetryStateListener = new TelemetryStateListener(userConfigurationStore, telemetryEventHandler);
    telemetryStateListener.initialize();

    const fetchScanResults = createFetchScanResults(axios.get);

    const interpreter = new Interpreter();
    const dispatcher = new DirectActionMessageDispatcher(interpreter);
    const userConfigMessageCreator = new UserConfigMessageCreator(dispatcher);
    const userConfigurationActionCreator = new UserConfigurationActionCreator(userConfigActions);

    registerUserConfigurationMessageCallback(interpreter, userConfigurationActionCreator);

    const deviceConnectActionCreator = new DeviceConnectActionCreator(deviceActions, fetchScanResults, telemetryEventHandler);
    const windowFrameActionCreator = new WindowFrameActionCreator(windowFrameActions);
    const windowStateActionCreator = new WindowStateActionCreator(windowStateActions, windowFrameActionCreator);
    const scanActionCreator = new ScanActionCreator(scanActions);

    const cardSelectionActionCreator = new CardSelectionActionCreator(interpreter, cardSelectionActions, telemetryEventHandler);
    cardSelectionActionCreator.registerCallbacks();
    const cardSelectionMessageCreator = new CardSelectionMessageCreator(dispatcher);

    const windowFrameListener = new WindowFrameListener(windowStateActionCreator, currentWindow);
    windowFrameListener.initialize();

    const getToolData = createGetToolDataDelegate(appDataAdapter);
    const unifiedResultsBuilder = createDefaultBuilder(getToolData);
    const scanController = new ScanController(
        scanActions,
        unifiedScanResultActions,
        fetchScanResults,
        unifiedResultsBuilder,
        telemetryEventHandler,
        DateProvider.getCurrentDate,
    );

    scanController.initialize();

    const fixInstructionProcessor = new FixInstructionProcessor();

    const cardsViewDeps: CardsViewDeps = {
        LinkComponent: ElectronLink,

        cardInteractionSupport: onlyHighlightingSupported, // once we have a working settings experience, switch to allCardInteractionsSupported
        getCardSelectionViewData: getCardSelectionViewData,
        collapsibleControl: CardsCollapsibleControl,
        fixInstructionProcessor,
        getGuidanceTagsFromGuidanceLinks: GetGuidanceTagsFromGuidanceLinks, // I don't think we have guidance links for axe-android

        userConfigMessageCreator: userConfigMessageCreator,
        cardSelectionMessageCreator,
        detailsViewActionMessageCreator: null,
        issueFilingActionMessageCreator: null, // we don't support issue filing right now

        environmentInfoProvider: null,
        getPropertyConfigById: getPropertyConfiguration, // this seems to be axe-core specific

        issueDetailsTextGenerator: null,
        issueFilingServiceProvider: null, // we don't support issue filing right now
        navigatorUtils: null,
        unifiedResultToIssueFilingDataConverter: null, // we don't support issue filing right now
        windowUtils: null,
    };

    const props: RootContainerProps = {
        deps: {
            currentWindow,
            userConfigurationStore,
            deviceStore,
            userConfigMessageCreator,
            windowStateActionCreator,
            LinkComponent: ElectronLink,
            fetchScanResults,
            deviceConnectActionCreator,
            storeHub,
            scanActionCreator,
            windowFrameActionCreator,
            platformInfo: new PlatformInfo(process),
            getCardsViewData: getCardViewData,
            getCardSelectionViewData: getCardSelectionViewData,
            screenshotViewModelProvider,
            ...cardsViewDeps,
        },
    };

    const renderer = new RootContainerRenderer(ReactDOM.render, document, props);
    renderer.render();

    sendAppInitializedTelemetryEvent(telemetryEventHandler);
});
