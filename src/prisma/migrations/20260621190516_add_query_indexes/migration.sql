-- CreateIndex
CREATE INDEX "Budget_userId_date_idx" ON "Budget"("userId", "date");

-- CreateIndex
CREATE INDEX "Budget_userId_categoryId_date_idx" ON "Budget"("userId", "categoryId", "date");

-- CreateIndex
CREATE INDEX "Category_userId_order_id_idx" ON "Category"("userId", "order", "id");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_id_idx" ON "Transaction"("userId", "date" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_status_date_idx" ON "Transaction"("userId", "categoryId", "status", "date");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
