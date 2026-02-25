import React from 'react';
import BalanceView from './BalanceView';
import CashFlowView from './CashFlowView';
import PLView from './PLView';

interface AccountingViewProps {
  subView: 'balance' | 'cashflow' | 'pl';
  onSubViewChange: (view: 'balance' | 'cashflow' | 'pl') => void;
}

const AccountingView: React.FC<AccountingViewProps> = ({ subView }) => {
  switch (subView) {
    case 'balance':
      return <BalanceView />;
    case 'cashflow':
      return <CashFlowView />;
    case 'pl':
      return <PLView />;
    default:
      return <BalanceView />;
  }
};

export default AccountingView;


