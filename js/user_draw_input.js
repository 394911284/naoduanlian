
var user_draw_input;
//页面加载完成就执行,就仅仅只需要加载所有的DOM结构
$(function() { 
		
	//手写输入系统
	user_draw_input = function(){
		//识别的样本json文件位置
		var word_data_json_path="./word_data.json?v=6";
		var syn_data_json_path="./syn_data.json";
		//用来输入的canvas画板
		var c=document.getElementById("user_input_canvas");
		var cxt=c.getContext("2d");//在画板上新建一个层?
		//cxt.fillStyle="#FF0000";
		//cxt.fillRect(0,0,150,75);
		
		//写字
		//cxt.font="20px Arial";
		//cxt.fillText("1234567890",0,20);
		
		var e_user_input_canvas=$('#user_input_canvas');//jquery获取画布元素
		//console.log(e_user_input_canvas.offset().top);
		//console.log(e_user_input_canvas.offset().left);
		var e_output_data_textarea=$('#output_data_textarea');//jquery获取样本数据元素
		var e_syn_data_textarea=$('#syn_data_textarea');//jquery获取神经节点数据元素
		
		
		var bbox = c.getBoundingClientRect();  //获取真实画布大小
		//var bbox_width_rate=(c.width / bbox.width);
		//var bbox_height_rate=(c.height / bbox.height);		
		var bbox_left=bbox.left;//获取画布距离左边的距离
		var bbox_top=bbox.top;//获取画布距离顶部的距离
			
		var user_input_points_arr=[];//记录用户画画路径点的数组
		var small_width=5;//缩放后的图像宽度个数
		var small_height=7;//缩放后的图像长度个数
		var small_points_arr=[];//缩放后的图像数据数组，每个元素都是数字，长度为 small_width * small_height
		
		var hide_nodes_num=8;//隐藏层节点数量
		var train_times=60000;//神经网络的训练次数
		//识别的样本对象，包含样本的长宽width,height,样本的数据数组data
		var data_obj=get_empty_obj('data');
		var syn_data_obj=get_empty_obj('syn');
		
		
		
		
		//设置缩放后的图像长度宽度个数(这个函数并没有使用，可以在开始的位置配置长宽)
		function set_small_width_height(width,height){
			small_width=width?width:4;
			small_height=height?height:5;
			data_obj.width=small_width;
			data_obj.width=small_height;
		}
		
		//清空画布
		function clear_canvas_input(){
			user_input_points_arr=[];//清空用户画画路径点的数组
			small_points_arr=[];//缩放后的图像数据数组
			//清空画布
			cxt.clearRect(0,0,e_user_input_canvas.attr('width'),e_user_input_canvas.attr('height'));
		}
		
		//从textarea读取识别的样本对象
		function get_data_obj_form_data_textarea(e_textarea,type){
			var json_to_obj;
			
			try{
			   json_to_obj=JSON.parse(e_textarea.val());//数据为json格式
			}catch(err){
			}
			
			var data_obj_t;
			if(json_to_obj){
				//转换成功返回转换的对象
				data_obj_t=json_to_obj;
			}else{
				//转换失败返回空对象
				data_obj_t=get_empty_obj(type);
			}
			
			return data_obj_t;
		}
		
		function get_empty_obj(type){
			if(type=='data'){
				return {width:small_width,height:small_height,data:[]};
			}else if(type=='syn'){
				return {'syn0':[],'syn1':[],'neural_word_array':[]};
			}
			return {width:small_width,height:small_height,data:[]};
		}
		
		//将识别的样本对象存到textarea
		function save_data_obj_to_data_textarea(data_obj,e_textarea){
			//将识别的样本对象存转为json格式存到textarea
			if(e_textarea){
				e_textarea.val(JSON.stringify(data_obj));
			}
		}
		
		//保存当前画的缩放后的样本图像
		function save_now_draw_data(){
			
			data_obj = get_data_obj_form_data_textarea(e_output_data_textarea,'data');//从textarea读取识别的样本对象
			
			var now_input_word=$('#now_input_word').val();//获取设置的当前录入文字
			var data_obj_data_length=data_obj.data.length;
			var find=false;
			
			var num_2=small_points_arr.join("");//当前样本的2进制表示
			var num_16=(parseInt(num_2,2)).toString(16);//当前样本的16进制表示
			
			//遍历之前的所有样本图像数据，看看之前有没有录入过这个文字
			for(var i=0;i<data_obj_data_length;i++){
				//如果录入过，则在这个文字中新增一个样本
				if(data_obj.data[i].word == now_input_word){
					find=true;
					data_obj.data[i].num_str_arr.push(num_16);
					break;
				}
			}
			//如果没有录入过，则新增文字数据
			if(!find){
				var new_data={
					word:now_input_word,
					num_str_arr:[num_16]
				}
				data_obj.data.push(new_data);
			}
			//console.log(JSON.stringify(data_obj));
			
			save_data_obj_to_data_textarea(data_obj,e_output_data_textarea);//将识别的样本对象存到textarea
		}
		
		//从json文件中读取保存在文件中的样本数据
		function load_json_data_from_json_file(){
			
			$.get(word_data_json_path,{}, function(result){
				if(result){
					data_obj=result;
					save_data_obj_to_data_textarea(data_obj,e_output_data_textarea);
				}else{
					data_obj=get_empty_obj('data');
				}
				//console.log(data_obj);
			},'json');
			
			
			$.get(syn_data_json_path,{}, function(result){
				if(result){
					syn_data_obj=result;
					save_data_obj_to_data_textarea(syn_data_obj,e_syn_data_textarea);
				}else{
					syn_data_obj=get_empty_obj('syn');
				}
				//console.log(data_obj);
			},'json');
			
		}
		
		//识别当前输入的文字，返回识别率从大到小的识别结果，每个数字只显示一次
		function recognize_now_draw_word(){
			var word = '';//识别结果
			
			data_obj = get_data_obj_form_data_textarea(e_output_data_textarea,'data');//从textarea读取识别的样本对象
			
			var height=data_obj.height;
			var width=data_obj.width;
			var num_2_length=height*width;
			
			
			var similarity_arr=[];//所有样本和当前输入的相似度存储数组
			var similarity_max=0;//所有样本中相似度最大值
			var similarity_max_data_index=-1;//最相似的文字的下标
			var similarity_max_num_str_arr_index=-1;//最相似的文字中的对应的样本的下标
			var similarity_max_word='';//最相似的文字
			//遍历所有文字
			for(var j=0;j<data_obj.data.length;j++){
				//遍历每个文字中的所有样本
				for(var i=0;i<data_obj.data[j].num_str_arr.length;i++){
					var similarity_total=0;//相似度总和
					var similarity_total_num1=0;//样本一不为空的相似度总和
					var similarity_count_num1=0;//样本一不为空的个数
					var similarity_total_num2=0;//样本二不为空的相似度总和
					var similarity_count_num2=0;//样本一不为空的个数
					
					var num_16=data_obj.data[j].num_str_arr[i];//当前样本的16进制表示
					var num_2=(parseInt(num_16,16)).toString(2);//当前样本的2进制表示
					
					//遍历样本的所有点
					for(var word_index=0;word_index<num_2_length;word_index++){
						//获得样本当前点的数字
						var num1=parseInt(num_2[word_index]);
						//获得对应位置当前输入图像的数字
						var num2=parseInt(small_points_arr[word_index]);
						//两个点是否都为1
						var num_similarity=(num1==1&&num2==1)?1:0;
						//样本当前点为0的位置不统计相似度
						similarity_total_num1+=num_similarity;
						if(num1!=0){
							similarity_count_num1++;
						}
						if(num1!=0||num2!=0){
							similarity_total_num2+=num_similarity;
							similarity_count_num2++;
						}
						//相似度总和累加当前点的相似度百分比
						similarity_total+=num_similarity;
						
					}
					
					var similarity=0;
					//运算每个点的平均相似度，作为样本和当前输入内容的相似度
					
					if(similarity_count_num1>0){
						//similarity=similarity_total/data_obj.data[j].num_str_arr[i].length;
						//相似度以 1.样本不为零的位置的点的相似度平均数 和 2.样本不为零不为零的点和所有不为零得点的个数对比 决定
						similarity=(similarity_total_num1/similarity_count_num1);
						var num_count_rate=similarity_count_num1/similarity_count_num2;
						
						
						similarity*=num_count_rate;
					}
					
					
					//将当前样本的文字所在下标，文字中样本所在下标，文字是什么，还有当前样本的相似度存到数组中
					similarity_arr.push({
						data_index:j,
						num_str_arr_index:i,
						word:data_obj.data[j].word,
						'similarity':similarity,
					});
					//如果当前样本的相似度比之前的都要高，则保存最相似的样本数据为当前样本
					if(similarity>similarity_max){
						similarity_max=similarity;//保存所有样本中相似度最大值
						similarity_max_data_index=j;//保存最相似的文字的下标
						similarity_max_num_str_arr_index=i;//保存最相似的文字中的对应的样本的下标
						similarity_max_word=data_obj.data[j].word;//保存最相似的文字
					}
				}
			}
			
			word=similarity_max_word;//识别结果为最相似的那个文字
			
			//所有样本计算结果按照相似度从大到小排序
			similarity_arr.sort(function(obj1,obj2){
				return obj2.similarity-obj1.similarity;
			});
			
			//已经输出过的文字记录器
			var similarity_out_have_obj={};
			
			
			var similarity_out_arr=[];//准备需要输出的数据数组
			//识别率从大到小的识别结果，每个数字只显示一次
			for(var i=0;i<similarity_arr.length;i++){
				//如果当前文字没有输出过
				if(!similarity_out_have_obj[similarity_arr[i].word]){
					similarity_out_arr.push(similarity_arr[i]);//保存当前文字相似度数据到待输出数组中
					similarity_out_have_obj[similarity_arr[i].word]=1;//当前文字标记为已输出过
				}
			}
			
			//console.log(similarity_out_arr);
			return similarity_out_arr;//返回需要输出的数据数组
		};
		
		//显示当前的识别结果到页面上
		function show_now_draw_word(){
			var similarity_out_arr = recognize_now_draw_word();
			
			$('#output_word').html('');
			for(var i=0;i<similarity_out_arr.length;i++){
				$('#output_word').append(('<p>' + similarity_out_arr[i].word + ':' + similarity_out_arr[i].similarity + '</p>'));
			}
		};
		
		//需要一个自动打包数据成json数据的系统
		//需要一个可以识别json数据的系统
		//需要一个比对系统
		
		function init(){
			
			//绑定画板的触摸事件
			$('#user_input_canvas').on('touchstart',function(e) {
				e.preventDefault();//防止滑动手势，页面滑动事件
				bbox = c.getBoundingClientRect(); 
				//如果画板设置的宽高和css设置的不同，则画板以css设置的宽高为准
				if(c.width!=bbox.width||c.height!=bbox.height){
					c.width=bbox.width;
					c.height=bbox.height;
				}
				//bbox_width_rate=(c.width / bbox.width);
				//bbox_height_rate=(c.height / bbox.height);
				bbox_left=bbox.left;
				bbox_top=bbox.top;
				//console.log(bbox_top);
				//获取手指的点击位置
				var _touch = e.originalEvent.targetTouches[0];
				//运算当前画画的点在画板上的坐标
				var x=(_touch.clientX-bbox_left) ;// * bbox_height_rate
				var y=(_touch.clientY-bbox_top) ;// * bbox_height_rate
				
				cxt.beginPath();//开始画画
				cxt.lineWidth="3";//画的线的粗细
				cxt.moveTo(x,y);//画笔移动到起始点
				
				/*
				cxt.beginPath();
				cxt.arc(x,y,1,0,360,false);
				cxt.fillStyle="red";//填充颜色,默认是黑色
				cxt.fill();//画实心圆
				cxt.closePath();
				*/
				user_input_points_arr.push({'x':x,'y':y});//记录当前画画的点
				//console.log(_touch);
				//console.log(ori_y);
			});
			$('#user_input_canvas').on('touchmove',function(e) {
				//e.preventDefault();
				//获取手指的点击位置
				var _touch = e.originalEvent.targetTouches[0];
				//运算当前画画的点在画板上的坐标
				var x=(_touch.clientX-bbox_left) ;// * bbox_height_rate
				var y=(_touch.clientY-bbox_top) ;// * bbox_height_rate
				
				cxt.lineTo(x,y);//画笔从上一个点画到现在的点
				cxt.stroke();//将画笔路径画到画板上
				
				
				/*
				cxt.beginPath();
				cxt.arc(x,y,1,0,360,false);
				cxt.fillStyle="red";//填充颜色,默认是黑色
				cxt.fill();//画实心圆
				cxt.closePath();
				*/
				
				user_input_points_arr.push({'x':x,'y':y});//记录当前画画的点
			});
			$('#user_input_canvas').on('touchend',function(e) {
				e.preventDefault();//防止滑动手势，页面滑动事件
				//var _touch = e.originalEvent.changedTouches[0];
				//var x=_touch.pageX-ori_x;
				//var y=_touch.pageY-ori_y;
				
				cxt.closePath();//停止画画
				
				//准备计算画画坐标的范围
				var x_min=999999;
				var x_max=-1;
				var y_min=999999;
				var y_max=-1;
				
				//用户输入了多少个点
				var user_input_points_arr_length=user_input_points_arr.length;
				//只有1个点或以下的时候不检测输入结果
				if(user_input_points_arr_length<=1){
					return ;
				}
				//遍历所有用户输入的点
				for(var i=0;i<user_input_points_arr_length;i++){
					//获得当前点的坐标
					var x = user_input_points_arr[i].x;
					var y = user_input_points_arr[i].y;
					
					//更新所有点的坐标到达的边界范围
					x_min=(x_min<x)?x_min:x;
					x_max=(x_max>x)?x_max:x;
					y_min=(y_min<y)?y_min:y;
					y_max=(y_max>y)?y_max:y;
				}
				
				//准备缩放后的图像每个位置点的个数统计数组
				small_points_arr=[];
				for(var i=0;i<small_width*small_height;i++){
					small_points_arr.push(0);
				}
				
				//计算画画坐标的范围的长宽
				var p_width = x_max - x_min;
				var p_height = y_max - y_min;
				
				//计算画画的坐标的长宽缩放的倍率
				var rate1 = (small_width)/p_width;
				var rate2 = (small_height)/p_height;
				
				//长宽缩放的倍率必须小于1
				rate1 = (rate1 < 1) ? rate1 : 1;
				rate2 = (rate2 < 1) ? rate2 : 1;
				
				
				//长宽缩放的倍率的差异度保护值?
				var protect_rate=5;
				//如果长宽差异过大，则将缩放过度的数据调小?
				if((rate2/rate1)>protect_rate){
					rate2=rate1/protect_rate;
				}else if((rate1/rate2)>protect_rate){
					rate1=rate2/protect_rate;
				}
				
				
				//console.log(rate1);
				//console.log(rate2);
				//var rate_min = (rate1<rate2)?rate1:rate2;
				
				//console.log(user_input_points_arr);
				
				//将用户输入的点缩放，统计到缩放后的点当中
				for(var i=0;i<user_input_points_arr_length;i++){
					var p_x = user_input_points_arr[i].x;
					var p_y = user_input_points_arr[i].y;
					var s_x = Math.floor((p_x-x_min)*rate1);
					var s_y = Math.floor((p_y-y_min)*rate2);
					s_x=(s_x>=small_width)?small_width-1:s_x;
					s_y=(s_y>=small_height)?small_height-1:s_y;
					var distance=0;//和上一个点之间的距离
					if(i<user_input_points_arr_length-1){
						distance=Math.sqrt(Math.pow(p_x-user_input_points_arr[i+1].x,2)+Math.pow(p_y-user_input_points_arr[i+1].y,2));
					}
					//每个点的权重和它距离上一个点的距离相关
					small_points_arr[s_x+s_y*small_width]+=distance;//这里加上和上一个点之间的距离，没有上一个点就加0
				}
				
				//找出缩放点中的最大值
				var small_points_max=0;
				for(var i=0;i<small_width*small_height;i++){
					small_points_max=small_points_arr[i]>small_points_max?small_points_arr[i]:small_points_max;
				}
				
				//根据最大值按比例将数字转为0-9或者0-1状态
				//将数字转换后的形态输出到页面上
				var e_output_div=$('#output_div');
				e_output_div.html('');
				for(var j=0;j<small_height;j++){
					for(var i=0;i<small_width;i++){
						//每个点最大数值是9，最小数值是0
						var num=Math.floor(small_points_arr[i+j*small_width]/small_points_max*100);
						num=(num>10)?1:0;
						small_points_arr[i+j*small_width]=num;
						e_output_div.append(num);
					}
					e_output_div.append('<br>');
				}
				
				var similarity_out_arr;
				//调用识别算法识别当前输入的内容
				//similarity_out_arr = recognize_now_draw_word();
				
				//调用神经网络识别算法识别当前输入的内容
				similarity_out_arr = recognize_now_draw_word_by_neural();
				
				//显示识别结果排序
				$('#output_word').html('');
				for(var i=0;i<similarity_out_arr.length;i++){
					$('#output_word').append(('<p>' + similarity_out_arr[i].word + ':' + similarity_out_arr[i].similarity + '</p>'));
				}
				
				//获取可用答案数组
				var available_word_max_num=3;//最多返回几个可用答案
				var available_word_similarity_min=0;//可用答案的相似度最小值是多少
				var available_word_arr=get_available_word_arr(similarity_out_arr,available_word_similarity_min,available_word_max_num);
				
				//如果答题方法存在，则将识别的答案传入答题方法
				try{ 
					if(user_answer_number&&typeof(user_answer_number)=="function"){ 
						user_answer_number(available_word_arr);
					}
				}catch(e){ 
				} 
				
			});
			
			//初始化时，调用 从json文件中读取保存在文件中的样本数据 的函数
			load_json_data_from_json_file();
		}
		
		//获取可用答案数组
		function get_available_word_arr(similarity_out_arr,available_word_similarity_min,available_word_max_num){
			var available_word_count=0;
			var available_word_arr=[];
			for(var i=0;i<similarity_out_arr.length;i++){
				if(similarity_out_arr[i].similarity > available_word_similarity_min){
					available_word_arr.push(similarity_out_arr[i].word);
					available_word_count++;
					if(available_word_count>=available_word_max_num){
						break;
					}
				}
			}
			return available_word_arr;
		}
		//数字前面补零
		function num_pad_0(num, n) {  
			var len = num.toString().length;  
			while(len < n) {  
				num = "0" + num;  
				len++;  
			}  
			return num;  
		}  
		//将储存的数据转为神经网络可以处理的格式
		function data_obj_to_neural_network_data(data_obj){
			var return_data={}
			return_data.height=data_obj.height;
			return_data.width=data_obj.width;
			
			var input_length = data_obj.width * data_obj.height;
			var input_array=[];
			var output_array=[];
			var word_array=[];
			
			for(var j=0;j<data_obj.data.length;j++){
				word_array.push(data_obj.data[j].word);
				var output_array_temp=[];
				for(var i=0;i<data_obj.data.length;i++){
					output_array_temp.push(0);
				}
				output_array_temp[j]=1;
				for(var i=0;i<data_obj.data[j].num_str_arr.length;i++){
					var num_16=data_obj.data[j].num_str_arr[i];//当前样本的16进制表示
					var num_2=(parseInt(num_16,16)).toString(2);//当前样本的2进制表示
					num_2=num_pad_0(num_2,input_length);
					var num_2_arr=num_2.split("");//当前样本的2进制数组表示
					input_array.push(num_2_arr);
					output_array.push(output_array_temp);
				}
			}
			
			return_data.input_array=input_array;
			return_data.output_array=output_array;
			return_data.word_array=word_array;
			
			return return_data;
		}
		
		
		
		// Sigmod function
		function nonlin(x, deriv) {
		  if (deriv) {
			return numeric.mul(x, numeric.sub(1, x));
		  }

		  return numeric.div(1, numeric.add(1, numeric.exp(numeric.neg(x))));
		}
		//训练神经网络
		function train_neural(neural_network_data,hide_nodes_num, iteration) {
			
			var input_length = neural_network_data.width * neural_network_data.height;
			var output_length = neural_network_data.word_array.length;
			
			neural_word_array=neural_network_data.word_array;
		  //show_data('input_array',neural_network_data.input_array);
		  //show_data('output_array',neural_network_data.output_array);
		  //return;
		  
		  // initialize weights
		  
			var syn0 = numeric.sub(numeric.mul(2, numeric.random([input_length, hide_nodes_num])), 1);
			var syn1 = numeric.sub(numeric.mul(2, numeric.random([hide_nodes_num, output_length])), 1);
			
		  //show_data('syn1',syn1);
		  //show_data('syn0',syn0);
		  
		  //Training loop
		  var i = 0;
		  var l2;
		   
		  for (; i < iteration; i++) {
			var l0 = neural_network_data.input_array;
			var l1 = nonlin(numeric.dot(l0, syn0));
			l2 = nonlin(numeric.dot(l1, syn1));
			var l2_error = numeric.sub(neural_network_data.output_array, l2);
			var l2_delta = numeric.mul(l2_error, nonlin(l2, true));
			var l1_error = numeric.dot(l2_delta, numeric.transpose(syn1));
			var l1_delta = numeric.mul(l1_error, nonlin(l1, true));
			syn1 = numeric.add(syn1, numeric.dot(numeric.transpose(l1), l2_delta));
			syn0 = numeric.add(syn0, numeric.dot(numeric.transpose(l0), l1_delta));
		  }
		  
		  show_data('Y',neural_network_data.output_array);
		  show_data('l2',l2);
		  show_data('syn1',syn1);
		  show_data('syn0',syn0);
		  var syn_data={
			  'syn0':syn0,
			  'syn1':syn1,
			  'neural_word_array':neural_word_array
		  }
		  save_data_obj_to_data_textarea(syn_data,e_syn_data_textarea);//将识别的样本对象存到textarea
		}

		//Initial input/output values

		
		function start_train_neural(){
			
			
			var data_obj = get_data_obj_form_data_textarea(e_output_data_textarea,'data');//从textarea读取识别的样本对象
			
			
			var neural_network_data = data_obj_to_neural_network_data(data_obj);
			
			train_neural(neural_network_data, hide_nodes_num, train_times);
			
		}
		
		function show_data(name,data_arr){
			var div_html='';
			if(data_arr){
				div_html += '<p>'+name+'</p>';
				div_html += '<table border="1">';
				var len_j = data_arr.length;
				for(var j = 0;j<len_j;j++){
					var len_i = data_arr[j].length;
					div_html += '<tr>';
					for(var i = 0;i<len_i;i++){
						div_html += '<th>'+Math.round(data_arr[j][i])+'</th>';
					}
					div_html += '</tr>';
				}
			}
			div_html += '</table>';
			$("#train_neural_div").append(div_html);
		}
		
		//使用神经网络识别当前内容
		function recognize_now_draw_word_by_neural(){
			var input_array=small_points_arr;
			
			syn_data_obj = get_data_obj_form_data_textarea(e_syn_data_textarea,'syn');
			
			var l0 = input_array;
			var l1 = nonlin(numeric.dot(l0, syn_data_obj.syn0));
			l2 = nonlin(numeric.dot(l1, syn_data_obj.syn1));
			
			var ouput_arr=[];
			for(var i=0;i<l2.length;i++){
				ouput_arr.push({
					word:syn_data_obj.neural_word_array[i],
					similarity:l2[i]
				});
			}
			
			//所有样本计算结果按照相似度从大到小排序
			ouput_arr.sort(function(obj1,obj2){
				return obj2.similarity-obj1.similarity;
			});
			
			return ouput_arr;
		}
		
		return{ 
			init:init,
			load_json_data_from_json_file:load_json_data_from_json_file, 
			clear_canvas_input:clear_canvas_input, 
			show_now_draw_word:show_now_draw_word, 
			save_now_draw_data:save_now_draw_data,
			start_train_neural:start_train_neural, 
		} 
		}();
		
		
		user_draw_input.init();
		
}); 
		
	
