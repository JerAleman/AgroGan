import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateCustomerDto, CreateServiceOrderDto } from './dto/services.dto';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get('customers')
  customers() {
    return this.services.listCustomers();
  }

  @Post('customers')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.services.createCustomer(dto);
  }

  @Get('orders')
  orders(@Query('status') status?: string) {
    return this.services.listOrders(status);
  }

  @Post('orders')
  createOrder(@Body() dto: CreateServiceOrderDto) {
    return this.services.createOrder(dto);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.services.updateOrderStatus(id, body.status);
  }

  @Get('profitability')
  profitability() {
    return this.services.profitability();
  }
}
