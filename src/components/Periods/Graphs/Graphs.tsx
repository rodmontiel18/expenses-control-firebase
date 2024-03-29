import { FC, useEffect, useMemo } from 'react';
import styles from '../../../styles/graph.module.scss';
import {
  ArcElement,
  ChartData,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Category } from '../../../models/category';
import { Card, Divider } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  finishRequest,
  getUserIncomesAction,
  getUserOutcomesAction,
  selectIncomesByPeriodId,
  selectOutcomesByPeriodId,
  selectRequestStatus,
} from '../../../app/redux/period';
import { RequestStatus } from '../../../models/api';
import { selectUser, setLoading } from '../../../app/redux/app';
import {
  getUserPaymentMethodsAction,
  selectPaymentMethods,
} from '../../../app/redux/paymentMethod';

interface GraphsProps {
  categories: Category[];
  periodId: string;
}

ChartJS.register(ArcElement, Tooltip, Legend);

const Graphs: FC<GraphsProps> = ({ categories, periodId }) => {
  const dispatch = useAppDispatch();
  const incomes = useAppSelector(selectIncomesByPeriodId(periodId));
  const outcomes = useAppSelector(selectOutcomesByPeriodId(periodId));
  const pMethods = useAppSelector(selectPaymentMethods);
  const requestStatus = useAppSelector(selectRequestStatus);
  const userId = useAppSelector(selectUser)?.uid || '';

  useEffect(() => {
    if (
      (!incomes || incomes.length < 1) &&
      (!outcomes || outcomes.length < 1) &&
      (!pMethods || pMethods.length < 1)
    ) {
      Promise.allSettled([
        dispatch(getUserOutcomesAction({ parentItemId: periodId, userId })),
        dispatch(getUserIncomesAction({ parentItemId: periodId, userId })),
        dispatch(getUserPaymentMethodsAction({ userId })),
      ]);
    } else {
      if (!incomes || incomes.length < 1) {
        dispatch(getUserIncomesAction({ parentItemId: periodId, userId }));
      }
      if (!outcomes || outcomes.length < 1) {
        dispatch(getUserOutcomesAction({ parentItemId: periodId, userId }));
      }
      if (!pMethods || pMethods.length < 1) {
        dispatch(getUserPaymentMethodsAction({ userId }));
      }
    }
  }, [periodId]);

  useEffect(() => {
    if (
      requestStatus === RequestStatus.FAILED ||
      requestStatus === RequestStatus.SUCCEEDED
    ) {
      dispatch(finishRequest());
    }
    if (requestStatus === RequestStatus.PENDING) {
      dispatch(setLoading(true));
    }
    if (requestStatus === RequestStatus.IDLE) {
      dispatch(setLoading(false));
    }
  }, [requestStatus]);

  const getRandomRGB = () => {
    const randomBetween = () => 0 + Math.floor(Math.random() * (255 - 0 + 1));
    const r = randomBetween();
    const g = randomBetween();
    const b = randomBetween();
    return `rgb(${r},${g},${b}, 1)`;
  };

  const generalGraphData = useMemo<ChartData<'doughnut'>>(() => {
    const config: ChartData<'doughnut'> = {
      labels: ['Incomes', 'Outcomes'],
      datasets: [
        {
          label: 'General balance',
          data: [
            incomes?.reduce<number>((acc, inc) => acc + inc.amount, 0) || 0,
            outcomes?.reduce<number>((acc, exp) => acc + exp.amount, 0) || 0,
          ],
          backgroundColor: ['rgba(11, 155, 27, 0.4)', 'rgba(201, 12, 15, 0.4)'],
          borderColor: ['rgba(11, 155, 27, 1)', 'rgba(201, 12, 15, 1)'],
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    };

    return config;
  }, [JSON.stringify(incomes), JSON.stringify(outcomes)]);

  const outcomesGraphData = useMemo<ChartData<'doughnut'>>(() => {
    const colors: string[] = [];
    const labels: string[] = [];
    const values: number[] = [];
    const mapValues = new Map<string, { amount: number; color: string }>();
    (outcomes || []).forEach(o => {
      const cat = categories.find(c => c.id === o.categoryId);
      if (cat) {
        const { name } = cat;
        if (mapValues.has(name)) {
          const currentValue = mapValues.get(name);
          if (currentValue) {
            mapValues.set(name, {
              ...currentValue,
              amount: currentValue.amount + o.amount,
            });
          }
        } else {
          mapValues.set(name, { amount: o.amount, color: cat.color });
        }
      }
    });

    mapValues.forEach((obj, category) => {
      colors.push(obj.color);
      labels.push(category);
      values.push(obj.amount);
    });

    const config: ChartData<'doughnut'> = {
      labels,
      datasets: [
        {
          label: 'Outcomes',
          data: values,
          backgroundColor: colors.map<string>(c => c.replace(', 1)', ', 0.4)')),
          borderColor: colors,
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    };
    return config;
  }, [JSON.stringify(outcomes), JSON.stringify(categories)]);

  const incomesGraphData = useMemo<ChartData<'doughnut'>>(() => {
    const colors: string[] = [];
    const labels: string[] = [];
    const values: number[] = [];
    const mapValues = new Map<string, { amount: number; color: string }>();
    (incomes || []).forEach(i => {
      const cat = categories.find(c => c.id === i.categoryId);
      if (cat) {
        const { name } = cat;
        if (mapValues.has(name)) {
          const currentValue = mapValues.get(name);
          if (currentValue) {
            mapValues.set(name, {
              ...currentValue,
              amount: currentValue.amount + i.amount,
            });
          }
        } else {
          mapValues.set(name, { amount: i.amount, color: cat.color });
        }
      }
    });

    mapValues.forEach((obj, category) => {
      colors.push(obj.color);
      labels.push(category);
      values.push(obj.amount);
    });

    const config: ChartData<'doughnut'> = {
      labels,
      datasets: [
        {
          label: 'Income',
          data: values,
          backgroundColor: colors.map<string>(c => c.replace(', 1)', ', 0.4)')),
          borderColor: colors,
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    };
    return config;
  }, [JSON.stringify(incomes), JSON.stringify(categories)]);

  const paymentMethodGraphData = useMemo<ChartData<'doughnut'>>(() => {
    const colors: string[] = [];
    const labels: string[] = [];
    const values: number[] = [];
    const mapValues = new Map<string, { amount: number; color: string }>();
    const mapColors = new Map<string, string>();
    (outcomes || []).forEach(o => {
      const pMethod = pMethods.find(p => p.id === o.paymentMethodId);
      if (pMethod) {
        const { name } = pMethod;
        let color = getRandomRGB();
        while (mapColors.has(color)) color = getRandomRGB();
        mapColors.set(color, color);
        if (mapValues.has(name)) {
          const currentValue = mapValues.get(name);
          if (currentValue) {
            mapValues.set(name, {
              ...currentValue,
              amount: currentValue.amount + o.amount,
            });
          }
        } else {
          mapValues.set(name, { amount: o.amount, color });
        }
      }
    });

    mapValues.forEach((obj, paymentMethod) => {
      colors.push(obj.color);
      labels.push(paymentMethod);
      values.push(obj.amount);
    });

    const config: ChartData<'doughnut'> = {
      labels,
      datasets: [
        {
          backgroundColor: colors.map<string>(c => c.replace(', 1)', ', 0.4)')),
          borderColor: colors,
          borderWidth: 1,
          data: values,
          hoverOffset: 4,
          label: 'Payment methods',
        },
      ],
    };

    return config;
  }, [JSON.stringify(outcomes), JSON.stringify(pMethods)]);

  if ((!incomes || incomes.length < 1) && (!outcomes || outcomes.length < 1)) {
    return (
      <div className="container">
        <div
          className={styles.graphContainer}
          style={{ textAlign: 'center', fontSize: 24 }}
        >
          <span>No data to show</span>
        </div>
      </div>
    );
  } else {
    return (
      <>
        <div className={styles.graphContainer}>
          <div className={styles.mainGraphsContainer}>
            <Card title={null}>
              <div className={styles.generalGraph}>
                <h3>General balance</h3>
                <div className={styles.graph}>
                  <Doughnut data={generalGraphData} />
                </div>
                <div className={styles.graphFooter}>
                  <span>Balance:</span>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(
                    (incomes || []).reduce((acc, inc) => acc + inc.amount, 0) -
                      (outcomes || []).reduce((acc, exp) => acc + exp.amount, 0)
                  )}
                </div>
              </div>
              {outcomes && outcomes?.length > 0 && (
                <>
                  <Divider />
                  <div className={styles.paymentMethodsGraph}>
                    <h3>Payment methods</h3>
                    <div className={styles.graph}>
                      <Doughnut data={paymentMethodGraphData} />
                    </div>
                    <div className={styles.graphFooter}>
                      <span>Total: </span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(
                        outcomes.reduce((acc, exp) => acc + exp.amount, 0)
                      )}
                    </div>
                  </div>
                  <Divider />
                  <div className={styles.outcomesGraph}>
                    <h3>Outcomes</h3>
                    <div className={styles.graph}>
                      <Doughnut data={outcomesGraphData} />
                    </div>
                    <div className={styles.graphFooter}>
                      <span>Total: </span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(
                        outcomes.reduce((acc, exp) => acc + exp.amount, 0)
                      )}
                    </div>
                  </div>
                </>
              )}
              {incomes && incomes?.length > 0 && (
                <>
                  <Divider />
                  <div className={styles.incomesGraph}>
                    <h3>Incomes</h3>
                    <div className={styles.graph}>
                      <Doughnut data={incomesGraphData} />
                    </div>
                    <div className={styles.graphFooter}>
                      <span>Total: </span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(
                        incomes.reduce((acc, inc) => acc + inc.amount, 0)
                      )}
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
        <div className="actionsContainer">
          <div className="backIcon">
            <Link to="/periods">
              <LeftOutlined />
            </Link>
          </div>
        </div>
      </>
    );
  }
};

export default Graphs;
