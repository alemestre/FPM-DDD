import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { WithdrawProductStockUseCase } from "../../application/use-cases/withdraw-product-stock.use-case";
import { RestockProductUseCase } from "../../application/use-cases/restock-product.use-case";
import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { DeleteProductUseCase } from "../../application/use-cases/delete-product.use-case";
import { UpdateProductUseCase } from "../../application/use-cases/update-product.use-case";
import { ListProductsUseCase } from "../../application/use-cases/list-products.use-case";
import type { ProductResponseDto } from "@fpm/contracts";
import { toProductResponse } from "./dto/product.response.mapper";
import { GetProductUseCase } from "../../application/use-cases/get-product.use-case";
import { CreateProductDto } from "./dto/create-product.dto";
import { StockMovementDto } from "./dto/stock-movement.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Controller("products")
export class ProductController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly restockProduct: RestockProductUseCase,
    private readonly withdrawProductStock: WithdrawProductStockUseCase,
    private readonly deleteProduct: DeleteProductUseCase
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return toProductResponse(await this.createProduct.execute(dto));
  }

  @Get()
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.listProducts.execute();
    return products.map(toProductResponse);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    return toProductResponse(await this.getProduct.execute(id));
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    return toProductResponse(await this.updateProduct.execute(id, dto));
  }

  @Post(":id/restock")
  @HttpCode(HttpStatus.OK)
  async restock(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() { quantity }: StockMovementDto
  ): Promise<ProductResponseDto> {
    return toProductResponse(await this.restockProduct.execute(id, quantity));
  }

  @Post(":id/withdraw")
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() { quantity }: StockMovementDto
  ): Promise<ProductResponseDto> {
    return toProductResponse(await this.withdrawProductStock.execute(id, quantity));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteProduct.execute(id);
  }
}
