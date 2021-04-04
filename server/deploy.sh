#!bin/bash

echo Qual será a versao?
read VERSION

docker build -t tegamano/myreddit:$VERSION .
docker push tegamano/myreddit:$VERSION
ssh root@165.227.193.46 "docker pull tegamano/myreddit:$VERSION && docker tag tegamano/myreddit:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"