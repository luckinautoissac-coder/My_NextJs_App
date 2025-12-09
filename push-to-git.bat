@echo off
echo ========================================
echo Git Push Script
echo ========================================
echo.

cd /d "H:\0. APP\3\3. Customized Business Assistant"

echo Current directory:
cd
echo.

echo Checking Git status...
git status
echo.

echo Adding all files...
git add .
echo.

echo Committing changes...
git commit -m "Add Supabase cloud storage and data migration feature"
echo.

echo Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo Done! Press any key to close...
pause

