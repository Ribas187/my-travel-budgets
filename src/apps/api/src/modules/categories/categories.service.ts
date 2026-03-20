import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/modules/prisma/prisma.service'
import type { CreateCategoryDto } from './dto/create-category.dto'
import type { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(travelId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { travelId, name: dto.name },
    })

    if (existing) {
      throw new ConflictException(
        'A category with this name already exists in this travel',
      )
    }

    return this.prisma.category.create({
      data: {
        travelId,
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        budgetLimit: dto.budgetLimit ?? null,
      },
    })
  }

  async update(travelId: string, catId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: catId, travelId },
    })

    if (!category) {
      throw new NotFoundException('Category not found')
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findFirst({
        where: { travelId, name: dto.name },
      })
      if (existing) {
        throw new ConflictException(
          'A category with this name already exists in this travel',
        )
      }
    }

    return this.prisma.category.update({
      where: { id: catId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...('budgetLimit' in dto && { budgetLimit: dto.budgetLimit ?? null }),
      },
    })
  }

  async remove(travelId: string, catId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: catId, travelId },
    })

    if (!category) {
      throw new NotFoundException('Category not found')
    }

    const expenseCount = await this.prisma.expense.count({
      where: { categoryId: catId },
    })

    if (expenseCount > 0) {
      throw new ConflictException(
        'Cannot delete this category because it has associated expenses. Please reassign or delete the expenses first.',
      )
    }

    await this.prisma.category.delete({
      where: { id: catId },
    })
  }
}
