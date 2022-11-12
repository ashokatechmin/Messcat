-- CreateTable
CREATE TABLE "MessItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MessItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMenu" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "weekId" INTEGER NOT NULL,

    CONSTRAINT "DailyMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Breakfast" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_Lunch" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_Snacks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_Dinner" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Breakfast_AB_unique" ON "_Breakfast"("A", "B");

-- CreateIndex
CREATE INDEX "_Breakfast_B_index" ON "_Breakfast"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Lunch_AB_unique" ON "_Lunch"("A", "B");

-- CreateIndex
CREATE INDEX "_Lunch_B_index" ON "_Lunch"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Snacks_AB_unique" ON "_Snacks"("A", "B");

-- CreateIndex
CREATE INDEX "_Snacks_B_index" ON "_Snacks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Dinner_AB_unique" ON "_Dinner"("A", "B");

-- CreateIndex
CREATE INDEX "_Dinner_B_index" ON "_Dinner"("B");

-- AddForeignKey
ALTER TABLE "_Breakfast" ADD CONSTRAINT "_Breakfast_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Breakfast" ADD CONSTRAINT "_Breakfast_B_fkey" FOREIGN KEY ("B") REFERENCES "MessItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Lunch" ADD CONSTRAINT "_Lunch_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Lunch" ADD CONSTRAINT "_Lunch_B_fkey" FOREIGN KEY ("B") REFERENCES "MessItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Snacks" ADD CONSTRAINT "_Snacks_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Snacks" ADD CONSTRAINT "_Snacks_B_fkey" FOREIGN KEY ("B") REFERENCES "MessItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Dinner" ADD CONSTRAINT "_Dinner_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Dinner" ADD CONSTRAINT "_Dinner_B_fkey" FOREIGN KEY ("B") REFERENCES "MessItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
