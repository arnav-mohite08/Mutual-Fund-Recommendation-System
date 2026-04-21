import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import joblib

df = pd.read_csv("C:/mlmodel/dataset/risk_profiling_dataset.csv")
x = df[['age','income_lpa','expenses_lpa','investment_horizon_years']]
y = df['risk_score']

x_train,x_test,y_train,y_test = train_test_split(x,y,test_size=0.2)

risk_model = LinearRegression()
risk_model.fit(x_train,y_train)

#risk_score = risk_model.predict([[25,12,1,20]])
#print("Output = ",risk_score)

joblib.dump(risk_model,"risk_model.pkl")