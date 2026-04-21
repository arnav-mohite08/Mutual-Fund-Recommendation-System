import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import joblib

df = pd.read_csv("C:/mlmodel/dataset/fund_category_dataset.csv")
x = df[['age','risk_score','investment_horizon_years','salary_lpa','monthly_investment']]
y = df[['equity_allocation','debt_allocation','hybrid_allocation']]

x_train,x_test,y_train,y_test = train_test_split(x,y,test_size=0.2)

category_model = LinearRegression()
category_model.fit(x_train,y_train)

#fund_category = category_model.predict([[20,0.7,3,12,10000]])
#print("Output = ",fund_category)

joblib.dump(category_model,"category_model.pkl")