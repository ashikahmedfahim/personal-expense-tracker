-- CreateTable
CREATE TABLE "FlowType" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "FlowType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowType_title_key" ON "FlowType"("title");
