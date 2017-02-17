
var user_draw_input;
//页面加载完成就执行,就仅仅只需要加载所有的DOM结构
$(function() { 
		
	//手写输入系统
	user_draw_input = function(){
		//识别的样本json文件位置
		var word_data_json_path="./word_data.json?v=2"
			
		var c=document.getElementById("user_input_canvas");
		var cxt=c.getContext("2d");
		//cxt.fillStyle="#FF0000";
		//cxt.fillRect(0,0,150,75);
		
		//写字
		//cxt.font="20px Arial";
		//cxt.fillText("1234567890",0,20);
		
		var e_user_input_canvas=$('#user_input_canvas');
		//console.log(e_user_input_canvas.offset().top);
		//console.log(e_user_input_canvas.offset().left);
		var bbox = c.getBoundingClientRect();  
		var bbox_width_rate=(c.width / bbox.width);
		var bbox_height_rate=(c.height / bbox.height);		
		var bbox_left=bbox.left;
		var bbox_top=bbox.top;
			
		var user_input_points_arr=[];
		var small_width=4;
		var small_height=5;
		var small_points_arr=[];
		
		var data_obj={width:small_width,height:small_height,data:[]};
		
		
		
		
		//
		function set_small_width_height(width,height){
			small_width=width?width:3;
			small_height=height?height:5;
			data_obj.width=small_width;
			data_obj.width=small_height;
		}
		
		//清空画布
		function clear_canvas_input(){
			user_input_points_arr=[];
			small_points_arr=[];
			cxt.clearRect(0,0,e_user_input_canvas.attr('width'),e_user_input_canvas.attr('height'));
		}
		
		
		
		//
		function draw_complete_fucntion(){
			
			var json_to_obj;
			
			try{
			   json_to_obj=JSON.parse($('#output_data_textarea').val());
			}catch(err){
			}
			
			
			
			if(json_to_obj){
				data_obj=json_to_obj;
			}else{
				data_obj={width:small_width,height:small_height,data:[]};
			}
			
			var now_input_word=$('#now_input_word').val();
			var data_obj_data_length=data_obj.data.length;
			var find=false;
			for(var i=0;i<data_obj_data_length;i++){
				if(data_obj.data[i].word == now_input_word){
					find=true;
					data_obj.data[i].num_str_arr.push(small_points_arr.join(""));
					break;
				}
			}
			if(!find){
				var new_data={
					word:now_input_word,
					num_str_arr:[small_points_arr.join("")]
				}
				data_obj.data.push(new_data);
			}
			//console.log(JSON.stringify(data_obj));
			
			$('#output_data_textarea').val(JSON.stringify(data_obj));
		}
		
		///
		function load_json_data(){
			
			$.get(word_data_json_path,{}, function(result){
				if(result){
					$('#output_data_textarea').val(JSON.stringify(result));
					data_obj=result;
				}else{
					data_obj={width:small_width,height:small_height,data:[]};
				}
				//console.log(data_obj);
			},'json');
			
		}
		
		
		function get_now_draw_word(){
			var word = '';
			
			var json_to_obj;
			
			try{
			   json_to_obj=JSON.parse($('#output_data_textarea').val());
			}catch(err){
			}
			
			if(json_to_obj){
				data_obj=json_to_obj;
			}else{
				data_obj={width:small_width,height:small_height,data:[]};
			}
			
			var similarity_arr=[];
			var width=data_obj.width;
			var height=data_obj.height;
			var similarity_max=0;
			var similarity_max_data_index=-1;
			var similarity_max_num_str_arr_index=-1;
			var similarity_max_word='';
			for(var j=0;j<data_obj.data.length;j++){
				for(var i=0;i<data_obj.data[j].num_str_arr.length;i++){
					var similarity_total=0;
					for(var word_index=0;word_index<data_obj.data[j].num_str_arr[i].length;word_index++){
						var num1=parseInt(data_obj.data[j].num_str_arr[i][word_index]);
						var num2=parseInt(small_points_arr[word_index]);
						similarity_total+=1-Math.abs((num1-num2)/9)
					}
					var similarity=similarity_total/data_obj.data[j].num_str_arr[i].length;
					similarity_arr.push({
						data_index:j,
						num_str_arr_index:i,
						word:data_obj.data[j].word,
						'similarity':similarity,
					});
					if(similarity>similarity_max){
						similarity_max=similarity;
						similarity_max_data_index=j;
						similarity_max_num_str_arr_index=i;
						similarity_max_word=data_obj.data[j].word;
					}
				}
			}
			word=similarity_max_word;
			similarity_arr.sort(function(obj1,obj2){
				return obj2.similarity-obj1.similarity;
			});
			
			
			var similarity_out_have_obj={};
			
			var similarity_out_arr=[];//识别率从大到小的识别结果，每个数字只显示一次
			for(var i=0;i<similarity_arr.length;i++){
				if(!similarity_out_have_obj[similarity_arr[i].word]){
					similarity_out_have_obj[similarity_arr[i].word]=1;
					similarity_out_arr.push(similarity_arr[i]);
				}
			}
			
			
			//console.log(similarity_out_arr);
			return similarity_out_arr;
		};
		
		function show_now_draw_word(){
			var similarity_out_arr = get_now_draw_word();
			
			$('#output_word').html('');
			for(var i=0;i<similarity_out_arr.length;i++){
				$('#output_word').append(('<p>' + similarity_out_arr[i].word + ':' + similarity_out_arr[i].similarity + '</p>'));
			}
		};
		
		//需要一个自动打包数据成json数据的系统
		//需要一个可以识别json数据的系统
		//需要一个比对系统
		
		function init(){
			
			$('#user_input_canvas').on('touchstart',function(e) {
				e.preventDefault();
				bbox = c.getBoundingClientRect(); 
				if(c.width!=bbox.width||c.height!=bbox.height){
					c.width=bbox.width;
					c.height=bbox.height;
				}
				bbox_width_rate=(c.width / bbox.width);
				bbox_height_rate=(c.height / bbox.height);
				bbox_left=bbox.left;
				bbox_top=bbox.top;
				//console.log(bbox_top);
				cxt.beginPath();
				var _touch = e.originalEvent.targetTouches[0];
				var x=(_touch.clientX-bbox_left) ;// * bbox_height_rate
				var y=(_touch.clientY-bbox_top) ;// * bbox_height_rate
				cxt.moveTo(x,y);
				user_input_points_arr.push({'x':x,'y':y});
				//console.log(_touch);
				//console.log(ori_y);
			});
			$('#user_input_canvas').on('touchmove',function(e) {
				//e.preventDefault();
				var _touch = e.originalEvent.targetTouches[0];
				var x=(_touch.clientX-bbox_left) ;// * bbox_height_rate
				var y=(_touch.clientY-bbox_top) ;// * bbox_height_rate
				cxt.lineTo(x,y);
				cxt.stroke();
				user_input_points_arr.push({'x':x,'y':y});
			});
			$('#user_input_canvas').on('touchend',function(e) {
				e.preventDefault();
				var _touch = e.originalEvent.changedTouches[0];
				//var x=_touch.pageX-ori_x;
				//var y=_touch.pageY-ori_y;
				cxt.closePath()
				var x_min=999999;
				var x_max=-1;
				var y_min=999999;
				var y_max=-1;
				var user_input_points_arr_length=user_input_points_arr.length;
				//只有1个点或以下的时候不检测输入结果
				if(user_input_points_arr_length<=1){
					return ;
				}
				for(var i=0;i<user_input_points_arr_length;i++){
					var x = user_input_points_arr[i].x;
					var y = user_input_points_arr[i].y;
					x_min=(x_min<x)?x_min:x;
					x_max=(x_max>x)?x_max:x;
					y_min=(y_min<y)?y_min:y;
					y_max=(y_max>y)?y_max:y;
				}
				
				small_points_arr=[];
				for(var i=0;i<small_width*small_height;i++){
					small_points_arr.push(0);
				}
				var p_width = x_max - x_min;
				var p_height = y_max - y_min;
				var rate1 = (small_width)/p_width;
				var rate2 = (small_height)/p_height;
				rate1 = (rate1 < 1) ? rate1 : 1;
				rate2 = (rate2 < 1) ? rate2 : 1;
				var protect_rate=5;
				if((rate2/rate1)>protect_rate){
					rate2=rate1/protect_rate;
				}else if((rate1/rate2)>protect_rate){
					rate1=rate2/protect_rate;
				}
				//console.log(rate1);
				//console.log(rate2);
				var rate_min = (rate1<rate2)?rate1:rate2;
				//console.log(user_input_points_arr);
				for(var i=0;i<user_input_points_arr_length;i++){
					var p_x = user_input_points_arr[i].x;
					var p_y = user_input_points_arr[i].y;
					var s_x = Math.round((p_x-x_min)*rate1);
					var s_y = Math.round((p_y-y_min)*rate2);
					s_x=(s_x>=small_width)?small_width-1:s_x;
					s_y=(s_y>=small_height)?small_height-1:s_y;
					var distance=0;//和上一个点之间的距离
					if(i<user_input_points_arr_length-1){
						distance=Math.sqrt(Math.pow(p_x-user_input_points_arr[i+1].x,2)+Math.pow(p_y-user_input_points_arr[i+1].y,2));
					}
					small_points_arr[s_x+s_y*small_width]+=distance;//这里加上和上一个点之间的距离，没有上一个点就加0
				}
				
				var small_points_max=0;
				for(var i=0;i<small_width*small_height;i++){
					small_points_max=small_points_arr[i]>small_points_max?small_points_arr[i]:small_points_max;
				}
				var e_output_div=$('#output_div');
				e_output_div.html('');
				for(var j=0;j<small_height;j++){
					for(var i=0;i<small_width;i++){
						var num=Math.floor(small_points_arr[i+j*small_width]/small_points_max*9);
						small_points_arr[i+j*small_width]=num;
						e_output_div.append(num);
					}
					e_output_div.append('<br>');
				}
				
				var similarity_out_arr = get_now_draw_word();
			
				$('#output_word').html('');
				for(var i=0;i<similarity_out_arr.length;i++){
					$('#output_word').append(('<p>' + similarity_out_arr[i].word + ':' + similarity_out_arr[i].similarity + '</p>'));
				}
				
				var available_word_max_num=3;
				var available_word_similarity_min=0.7;
				var available_word_arr=get_available_word_arr(similarity_out_arr,available_word_similarity_min,available_word_max_num);
				
				try{ 
					if(user_answer_number&&typeof(user_answer_number)=="function"){ 
						user_answer_number(available_word_arr);
					}
				}catch(e){ 
				} 
				
			});
			
			
			load_json_data();
		}
		
		//获取可用的输入
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
		
		
		return{ 
			init:init,
			load_json_data:load_json_data, 
			clear_canvas_input:clear_canvas_input, 
			show_now_draw_word:show_now_draw_word, 
			draw_complete_fucntion:draw_complete_fucntion, 
			clear_canvas_input:clear_canvas_input, 
		} 
		}();
		
		
		user_draw_input.init();
		
}); 
		
	