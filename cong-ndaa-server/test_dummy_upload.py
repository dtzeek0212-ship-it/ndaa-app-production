import requests

url = "http://localhost:3001/api/extract"
files = {'document': open('/Users/David/Desktop/NDAA/Requests/21Feb Request/ARC-Mills FY27 NDAA.pdf', 'rb')}

response = requests.post(url, files=files)
print(response.json())
