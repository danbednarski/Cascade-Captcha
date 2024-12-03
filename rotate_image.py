from PIL import Image 

image = Image.open("./christus.png") 

number_of_rotations = 6

for i in range(number_of_rotations):
    degrees = 360 / number_of_rotations * i
    print(degrees)
    rotated_image = image.rotate(degrees, resample=Image.BICUBIC, fillcolor='white')
    rotated_image.save(f'./public/images/christus/christus_{i}.png')
