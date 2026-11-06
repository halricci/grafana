import { act } from '@testing-library/react';
import { render } from 'test/test-utils';

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
      expect(mockUseCorrelationsK8s).toHaveBeenCalled();
      await act(async () => {});
    });
  });

  describe('with the kubernetes feature toggle off', () => {
    it('uses the legacy correlations hook', async () => {
      config.featureToggles = { ...originalFeatureToggles, kubernetesCorrelations: false };
      render(<CorrelationsPageWrapper />);
      expect(mockUseCorrelations).toHaveBeenCalled();
      await act(async () => {});
    });
  });
});
