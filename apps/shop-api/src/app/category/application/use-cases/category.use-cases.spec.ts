import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { CategoryRepository } from '../../domain/category.repository';
import { CreateCategoryUseCase } from './create-category.use-case';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { ListCategoriesUseCase } from './list-categories.use-case';
import { UpdateCategoryUseCase } from './update-category.use-case';
import { GetCategoryUseCase } from './get-category.use-case';
import { Category } from '../../domain/category.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

const existingCategory = () => Category.reconstitute(CATEGORY_ID, 'Fruits');

const createRepositoryMock = (): jest.Mocked<CategoryRepository> => ({
  save: jest.fn(async (category: Category) => category),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('use cases des catégories', () => {
  let repository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    repository = createRepositoryMock();
  });

  describe('CreateCategoryUseCase', () => {
    it('crée puis sauvegarde la catégorie', async () => {
      const category = await new CreateCategoryUseCase(repository).execute('Fruits');

      expect(repository.save).toHaveBeenCalledWith(category);
      expect(category.name).toBe('Fruits');
    });

    it('ne sauvegarde rien si le nom est invalide', async () => {
      await expect(new CreateCategoryUseCase(repository).execute('ab')).rejects.toBeInstanceOf(
        DomainValidationError,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('UpdateCategoryUseCase', () => {
    it("renomme via l'entité puis sauvegarde l'agrégat", async () => {
      repository.findByIdOrFail.mockResolvedValue(existingCategory());

      const category = await new UpdateCategoryUseCase(repository).execute(CATEGORY_ID, 'Légumes');

      expect(repository.save).toHaveBeenCalledWith(category);
      expect(repository.update).not.toHaveBeenCalled();
      expect(category.id).toBe(CATEGORY_ID);
      expect(category.name).toBe('Légumes');
    });

    it('ne sauvegarde rien si le nom est invalide', async () => {
      repository.findByIdOrFail.mockResolvedValue(existingCategory());

      await expect(new UpdateCategoryUseCase(repository).execute(CATEGORY_ID, 'ab')).rejects.toBeInstanceOf(
        DomainValidationError,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("propage l'erreur si la catégorie n'existe pas", async () => {
      repository.findByIdOrFail.mockRejectedValue(new NotFoundException());

      await expect(new UpdateCategoryUseCase(repository).execute(CATEGORY_ID, 'Légumes')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteCategoryUseCase', () => {
    it('supprime une catégorie existante', async () => {
      repository.findByIdOrFail.mockResolvedValue(existingCategory());

      await new DeleteCategoryUseCase(repository).execute(CATEGORY_ID);

      expect(repository.delete).toHaveBeenCalledWith(CATEGORY_ID);
    });

    it("ne supprime rien si la catégorie n'existe pas", async () => {
      repository.findByIdOrFail.mockRejectedValue(new NotFoundException());

      await expect(new DeleteCategoryUseCase(repository).execute(CATEGORY_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  it('ListCategoriesUseCase retourne toutes les catégories', async () => {
    const categories = [existingCategory()];
    repository.findAll.mockResolvedValue(categories);

    await expect(new ListCategoriesUseCase(repository).execute()).resolves.toBe(categories);
  });

  it('GetCategoryUseCase charge la catégorie par id', async () => {
    const category = existingCategory();
    repository.findByIdOrFail.mockResolvedValue(category);

    await expect(new GetCategoryUseCase(repository).execute(CATEGORY_ID)).resolves.toBe(category);
  });
});
