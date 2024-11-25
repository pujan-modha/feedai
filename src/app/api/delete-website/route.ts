import prisma from "@/lib/prisma";

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return new Response("Invalid request: Missing or incorrect ID", {
      status: 400,
    });
  }
  try {
    const deletedWebsite = await prisma.websites.delete({
      where: {
        id: id,
      },
    });
    return new Response(JSON.stringify(deletedWebsite), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting website:", error);
    return new Response("Error deleting website", { status: 500 });
  }
}