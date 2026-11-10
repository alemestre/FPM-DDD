import { Module } from "@nestjs/common";
import { CreateProductUseCase } from "./application/use-cases/create-product.use-case";
import { DeleteProductUseCase } from "./application/use-cases/delete-product.use-case";
import { GetProductUseCase } from "./application/use-cases/get-product.use-case";
import { ListProductsUseCase } from "./application/use-cases/list-products.use-case";
import { RestockProductUseCase } from "./application/use-cases/restock-product.use-case";
import { UpdateProductUseCase } from "./application/use-cases/update-product.use-case";
import { WithdrawProductStockUseCase } from "./application/use-cases/withdraw-product-stock.use-case";
import { ProductRepository } from "./domain/product.repository";
import { PrismaProductRepository } from "./infrastructure/prisma-product.repository";
import { ProductController } from "./interface/http/product.controller";
import { GetProductsByCategoryIdUseCase } from "./application/use-cases/get-products-by-category-id.use-case";

@Module({
  controllers: [ProductController],
  providers: [
    { provide: ProductRepository, useClass: PrismaProductRepository },
    CreateProductUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    GetProductsByCategoryIdUseCase,
    UpdateProductUseCase,
    RestockProductUseCase,
    WithdrawProductStockUseCase,
    DeleteProductUseCase
  ]
})
export class ProductModule {}
