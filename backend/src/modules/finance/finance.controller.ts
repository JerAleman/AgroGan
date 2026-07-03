import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateAccountDto, CreateBudgetDto, CreateTransactionDto } from './dto/finance.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('accounts')
  accounts() {
    return this.finance.listAccounts();
  }

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.finance.createAccount(dto);
  }

  @Get('transactions')
  transactions(@Query('from') from?: string, @Query('to') to?: string, @Query('category') category?: string) {
    return this.finance.listTransactions(from, to, category);
  }

  @Post('transactions')
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.finance.createTransaction(dto);
  }

  @Get('cash-flow')
  cashFlow(@Query('from') from?: string, @Query('to') to?: string) {
    return this.finance.cashFlow(from, to);
  }

  @Get('pnl')
  pnl(@Query('from') from?: string, @Query('to') to?: string) {
    return this.finance.profitAndLoss(from, to);
  }

  @Get('budgets')
  budgets(@Query('period') period?: string) {
    return this.finance.listBudgets(period);
  }

  @Post('budgets')
  createBudget(@Body() dto: CreateBudgetDto) {
    return this.finance.createBudget(dto);
  }
}
