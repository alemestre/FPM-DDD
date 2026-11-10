import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { WithdrawProductStockUseCase } from '../../application/use-cases/withdraw-product-stock.use-case';
import { RestockProductUseCase } from '../../application/use-cases/restock-product.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { toProductResponse, toProductWithProducerResponse } from './dto/product.response.mapper';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { CreateProductDto } from './dto/create-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsByCategoryIdUseCase } from '../../application/use-cases/get-products-by-category-id.use-case';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

@Controller('products')
export class ProductController {
    constructor(
        private readonly createProduct: CreateProductUseCase,
        private readonly listProducts: ListProductsUseCase,
        private readonly getProductsByCategoryId: GetProductsByCategoryIdUseCase,
        private readonly getProduct: GetProductUseCase,
        private readonly updateProduct: UpdateProductUseCase,
        private readonly restockProduct: RestockProductUseCase,
        private readonly withdrawProductStock: WithdrawProductStockUseCase,
        private readonly deleteProduct: DeleteProductUseCase,
    ) {}

    @Post()
    async create(@Body() dto: CreateProductDto) {
        return toProductResponse(await this.createProduct.execute(dto));
    }

    @Get()
    async findAll(@Query() { categoryId }: ListProductsQueryDto): Promise<ProductWithProducerResponseDto[]> {
        const products = categoryId
            ? await this.getProductsByCategoryId.execute(categoryId)
            : await this.listProducts.execute();
        return products.map(toProductWithProducerResponse);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductWithProducerResponseDto> {
        return toProductWithProducerResponse(await this.getProduct.execute(id));
    }

    @Patch(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
        return toProductResponse(await this.updateProduct.execute(id, dto));
    }

    @Post(':id/restock')
    @HttpCode(HttpStatus.OK)
    async restock(@Param('id', ParseUUIDPipe) id: string, @Body() { quantity }: StockMovementDto) {
        return toProductResponse(await this.restockProduct.execute(id, quantity));
    }

    @Post(':id/withdraw')
    @HttpCode(HttpStatus.OK)
    async withdraw(@Param('id', ParseUUIDPipe) id: string, @Body() { quantity }: StockMovementDto) {
        return toProductResponse(await this.withdrawProductStock.execute(id, quantity));
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.deleteProduct.execute(id);
    }
}
