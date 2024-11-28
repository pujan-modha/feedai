import prisma from "./prisma";

export async function populateCategories(categories: Array<string>) {
  const json_categories: { [key: string]: string[] } = {};

  // Use Promise.all to wait for all async operations
  await Promise.all(
    categories.map(async (category_id: string) => {
      console.log(category_id);
      const parent_category = await prisma.categories.findFirst({
        where: {
          id: parseInt(category_id),
        },
      });

      const child_categories = await prisma.categories.findMany({
        where: {
          parent_id: parseInt(category_id),
        },
      });

      if (parent_category) {
        // Create key in format "Parent Category Name (Category ID)"
        const parentKey = `${parent_category.name} (ID: ${parent_category.id})`;
        
        // Map children to format "Child Category Name (Category ID)"
        json_categories[parentKey] = child_categories.map(
          child => `${child.name} (ID: ${child.id})`
        );
      }
    })
  );

  return json_categories;
}
