import { render, screen } from 'test/test-utils';

import { config } from '@grafana/runtime';

import CorrelationsPageWrapper from './CorrelationsPageWrapper';

jest.mock('app/core/services/context_srv');

const mockUseCorrelations = jest.fn().mockReturnValue({
  remove: { execute: jest.fn() },
  get: { execute: jest.fn(), value: [], loading: false, error: undefined },
});
const mockUseCorrelationsK8s = jest.fn().mockReturnValue({
  currentData: [],
  isLoading: false,
  error: undefined,
  remainingItems: 0,
});

jest.mock('./useCorrelations', () => ({
  useCorrelations: () => mockUseCorrelations(),
}));

jest.mock('./useCorrelationsK8s', () => ({
  useCorrelationsK8s: () => mockUseCorrelationsK8s(),
}));

describe('CorrelationsPageWrapper', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  describe('with the kubernetes feature toggle on', () => {
    it('uses the K8s correlations hook', async () => {
      config.featureToggles = { ...originalFeatureToggles, kubernetesCorrelations: true };
      render(<CorrelationsPageWrapper />);
      // The page loads the data source list asynchronously; wait for that update to settle.
      expect(await screen.findByText('There are no correlations configured yet.')).toBeInTheDocument();
      expect(mockUseCorrelationsK8s).toHaveBeenCalled();
    });
  });

  describe('with the kubernetes feature toggle off', () => {
    it('uses the legacy correlations hook', async () => {
      config.featureToggles = { ...originalFeatureToggles, kubernetesCorrelations: false };
      render(<CorrelationsPageWrapper />);
      // The page loads the data source list asynchronously; wait for that update to settle.
      expect(await screen.findByText('There are no correlations configured yet.')).toBeInTheDocument();
      expect(mockUseCorrelations).toHaveBeenCalled();
    });
  });
});
