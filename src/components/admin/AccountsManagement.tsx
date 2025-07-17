import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ArrowLeftRight, Receipt, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CashTransferDialog from './accounts/CashTransferDialog';
import ExpenseDialog from './accounts/ExpenseDialog';
import TransactionsTable from './accounts/TransactionsTable';
import ExpensesTable from './accounts/ExpensesTable';

interface CashSummary {
  cash_in_hand: number;
  cash_at_bank: number;
}

interface AccountsManagementProps {
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

const AccountsManagement: React.FC<AccountsManagementProps> = ({ permissions }) => {
  const [cashSummary, setCashSummary] = useState<CashSummary>({ cash_in_hand: 0, cash_at_bank: 0 });
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCashSummary();
  }, []);

  const loadCashSummary = async () => {
    try {
      // Calculate cash in hand from approved registrations
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('fee_paid')
        .eq('status', 'approved')
        .not('fee_paid', 'is', null);

      if (regError) throw regError;

      const totalCollected = registrations?.reduce((sum, reg) => sum + (reg.fee_paid || 0), 0) || 0;

      // Get cash transfers
      const { data: transfers, error: transferError } = await supabase
        .from('cash_transactions')
        .select('amount')
        .eq('transaction_type', 'cash_transfer');

      if (transferError) throw transferError;

      const totalTransferred = transfers?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;

      // Get cash expenses
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('payment_method', 'cash');

      if (expenseError) throw expenseError;

      const totalCashExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      // Get bank expenses
      const { data: bankExpenses, error: bankExpenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('payment_method', 'bank');

      if (bankExpenseError) throw bankExpenseError;

      const totalBankExpenses = bankExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      setCashSummary({
        cash_in_hand: totalCollected - totalTransferred - totalCashExpenses,
        cash_at_bank: totalTransferred - totalBankExpenses
      });
    } catch (error) {
      console.error('Error loading cash summary:', error);
      toast({
        title: "Error",
        description: "Failed to load cash summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSuccess = () => {
    loadCashSummary();
    setIsTransferDialogOpen(false);
  };

  const handleExpenseSuccess = () => {
    loadCashSummary();
    setIsExpenseDialogOpen(false);
  };

  if (!permissions.canRead) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to view accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cash Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cashSummary.cash_in_hand.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total collected fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash at Bank</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cashSummary.cash_at_bank.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Transferred to bank
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {permissions.canWrite && (
        <div className="flex gap-4">
          <Button 
            onClick={() => setIsTransferDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Cash Transfer
          </Button>
          <Button 
            onClick={() => setIsExpenseDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Cash Transfers</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <TransactionsTable permissions={permissions} onDataChange={loadCashSummary} />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTable permissions={permissions} onDataChange={loadCashSummary} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CashTransferDialog 
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        onSuccess={handleTransferSuccess}
        maxAmount={cashSummary.cash_in_hand}
      />

      <ExpenseDialog 
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSuccess={handleExpenseSuccess}
        cashInHand={cashSummary.cash_in_hand}
        cashAtBank={cashSummary.cash_at_bank}
      />
    </div>
  );
};

export default AccountsManagement;