import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/create-account.use-case.js';
import { DeleteAccountUseCase } from '../../application/delete-account.use-case.js';
import { GetCatalogTreeUseCase } from '../../application/get-catalog-tree.use-case.js';
import { RenameAccountUseCase } from '../../application/rename-account.use-case.js';
import { toAccountResponse } from './account.presenter.js';
import { DomainErrorFilter } from './domain-error.filter.js';

interface CreateAccountBody {
  code?: unknown;
  name?: unknown;
  nature?: unknown;
}

interface RenameAccountBody {
  name?: unknown;
}

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

function parseDate(value: string | undefined, field: string, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}` : value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException({ message: `Fecha inválida en "${field}"`, field });
  }
  return date;
}

@Controller('accounts')
@UseFilters(DomainErrorFilter)
export class AccountsController {
  constructor(
    @Inject(CreateAccountUseCase) private readonly createAccount: CreateAccountUseCase,
    @Inject(GetCatalogTreeUseCase) private readonly getCatalogTree: GetCatalogTreeUseCase,
    @Inject(RenameAccountUseCase) private readonly renameAccount: RenameAccountUseCase,
    @Inject(DeleteAccountUseCase) private readonly deleteAccount: DeleteAccountUseCase,
  ) {}

  @Get('tree')
  tree(@Query('search') search?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.getCatalogTree.execute({
      search,
      from: parseDate(from, 'from'),
      to: parseDate(to, 'to', true),
    });
  }

  @Post()
  async create(@Body() body: CreateAccountBody = {}) {
    const account = await this.createAccount.execute({
      code: asString(body.code),
      name: asString(body.name),
      nature: typeof body.nature === 'string' ? body.nature : undefined,
    });
    return toAccountResponse(account, true); // recién creada: no tiene hijas
  }

  @Patch(':code')
  async rename(@Param('code') code: string, @Body() body: RenameAccountBody = {}) {
    const account = await this.renameAccount.execute(code, asString(body.name));
    return { code: account.code.toString(), name: account.name };
  }

  @Delete(':code')
  @HttpCode(204)
  async remove(@Param('code') code: string) {
    await this.deleteAccount.execute(code);
  }
}