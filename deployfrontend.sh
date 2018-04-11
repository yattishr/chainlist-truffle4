rsync -r src/ docs/
rsync build/contracts/ChainList.json docs/
git add .
git commit -m "Adding frontend files to Github pages."
git push
