import csv

ciudades = []
url_base = "https://www.waze.com/en/live-map/directions?to=ll." #Delimitador %2C
with open('coordenadas.csv') as csvfile:
    spamreader = csv.reader(csvfile,delimiter= ',')
    primera = True
    for row in spamreader:
        if(primera):
            primera = False
            continue
        ciudades.append(row) #ciudad, latitud, longitud

with open('cities.csv','w',newline="") as csvfile:
    spamwriter = csv.writer(csvfile,delimiter=",")
    spamwriter.writerow(["url","city"])
    for ciudad in ciudades:
        print(ciudad)
        coorden = ciudad[2].split(";")
        spamwriter.writerow([url_base+coorden[1]+"%2C"+coorden[2],ciudad[0]])
