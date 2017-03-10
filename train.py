
import json
import numpy as np

#将储存的数据转为神经网络可以处理的格式
def data_obj_to_neural_network_data(data_obj):
			return_data={}
			return_data['height']=data_obj['height'];
			return_data['width']=data_obj['width'];
			
			input_length = data_obj['width'] * data_obj['height'];
			input_array=[];
			output_array=[];
			word_array=[];
			
			for j,data_obj_data_now in enumerate(data_obj['data']) :
				word_array.append(data_obj_data_now['word']);
				output_array_temp=[];
				for i in range(0,len(data_obj['data'])):
					output_array_temp.append(0);
				
				output_array_temp[j]=1;
				for i,num_str_arr_now in enumerate(data_obj_data_now['num_str_arr']) :
					num_16=num_str_arr_now;#当前样本的16进制表示
					num_2=bin(int(num_16, 16));#当前样本的2进制表示
					num_2=num_2[2:].zfill(input_length);#字符串补0
					num_2_arr=list(num_2);#当前样本的2进制数组表示
					num_2_arr=[ int(i) for i in num_2_arr];#当前样本的2进制数组表示
					input_array.append(num_2_arr);
					output_array.append(output_array_temp);
				
			
			
			return_data['input_array']=input_array;
			return_data['output_array']=output_array;
			return_data['word_array']=word_array;
			
			return return_data;


# sigmoid function
def nonlin(x,deriv=False):
    if(deriv==True):
        return x*(1-x)
    return 1/(1+np.exp(-x))

#训练神经网络
def train_neural(neural_network_data,hide_nodes_num, iteration):
			input_length = neural_network_data['width'] * neural_network_data['height'];
			output_length = len(neural_network_data['word_array']);
			
			neural_word_array=neural_network_data['word_array'];
			#show_data('input_array',neural_network_data.input_array);
			#show_data('output_array',neural_network_data.output_array);
			
		  
			# initialize weights
			
			
			syn0 = 2*np.random.random((input_length,hide_nodes_num)) - 1;
			syn1 = 2*np.random.random((hide_nodes_num,output_length)) - 1;
			
			#show_data('syn1',syn1);
			#show_data('syn0',syn0);
		  
			#Training loop
			i = 0;
		   
			# input dataset
			X = np.array(neural_network_data['input_array'])
			 
			# output dataset            
			y = np.array(neural_network_data['output_array'])
					
			for i in range(0,iteration):
				l0 = X;
				l1 = nonlin(np.dot(l0, syn0));
				l2 = nonlin(np.dot(l1, syn1));
				l2_error = y - l2;
				l2_delta = l2_error * nonlin(l2, True);
				l1_error = np.dot(l2_delta, syn1.T);
				l1_delta = l1_error * nonlin(l1, True);
				syn1 += np.dot(l1.T, l2_delta);
				syn0 += np.dot(l0.T, l1_delta);
			
		  
			#show_data('Y',neural_network_data['output_array']);
			#show_data('l2',l2);
			#show_data('syn1',syn1);
			#show_data('syn0',syn0);
			print ('Y');
			print (neural_network_data['output_array']);
			print ('l2');
			print (l2);
			print ('syn1');
			print (syn1);
			print ('syn0');
			print (syn0);
			syn_data={
				'syn0':syn0.tolist(),
				'syn1':syn1.tolist(),
				'neural_word_array':neural_word_array
			};
			return syn_data;
		





with open('word_data.json', 'r') as f:
	data_obj = json.load(f)
	
neural_network_data=data_obj_to_neural_network_data(data_obj);
syn_data=train_neural(neural_network_data,8,60000);
#print (syn_data)
	
	
# Writing JSON data
with open('syn_data_py.json', 'w') as f:
	json.dump(syn_data, f)

	
 