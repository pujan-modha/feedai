import prisma from "./prisma";

export async function populateCategories(categories: Array<any>) {
  const json_category: any = {};
  
  // Use Promise.all to wait for all async operations
  await Promise.all(categories.map(async (category_id: string) => {
    const parent_category = await prisma.categories.findFirst({
      where: {
        id: parseInt(category_id),
      },
    });

    const child_category = await prisma.categories.findMany({
      where: {
        parent_id: parseInt(category_id),
      },
    });
    
    json_category["Parent Category"] = parent_category.name;
    json_category["Child Category"] = child_category.map((child) => {
      return child.name;
    });
  }));

  console.log("from populateCategories", json_category);
  return json_category;
}