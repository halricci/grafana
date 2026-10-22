import { locationUtil } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Card, EmptyState, LinkButton } from '@grafana/ui';
import { ROUTES } from 'app/features/connections/constants';

interface Props {
  onClick?: () => void;
  canWriteCorrelations: boolean;
  hasDataSources: boolean;
}
export const EmptyCorrelationsCTA = ({ onClick, canWriteCorrelations, hasDataSources }: Props) => {
  if (!canWriteCorrelations) {
    return (
      <Card noMargin>
        <Card.Heading>
          <Trans i18nKey="correlations.empty-correlations-cta.there-are-no-correlations-configured-yet">
            There are no correlations configured yet.
          </Trans>
        </Card.Heading>
        <Card.Description>
          <Trans i18nKey="correlations.empty-correlations-cta.please-contact-administrator-create-correlations">
            Please contact your administrator to create new correlations.
          </Trans>
        </Card.Description>
      </Card>
    );
  }

  if (!hasDataSources) {
    return (
      <EmptyState
        variant="call-to-action"
        button={
          <LinkButton icon="database" href={locationUtil.assureBaseUrl(ROUTES.DataSourcesNew)} size="lg">
            <Trans i18nKey="correlations.empty-state.no-data-sources.button-title">Add data source</Trans>
          </LinkButton>
        }
        message={t(
          'correlations.empty-state.no-data-sources.title',
          'Add a data source before defining correlations'
        )}
      />
    );
  }

  return (
    <EmptyState
      variant="call-to-action"
      button={
        <Button icon="gf-glue" onClick={onClick} size="lg">
          <Trans i18nKey="correlations.empty-state.button-title">Add correlation</Trans>
        </Button>
      }
      message={t('correlations.empty-state.title', "You haven't defined any correlations yet")}
    >
      <Trans i18nKey="correlations.empty-state.pro-tip">
        You can also define correlations via datasource provisioning
      </Trans>
    </EmptyState>
  );
};
