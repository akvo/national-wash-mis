from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_data.models import FormData, Answers
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_profile.models import Administration
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField, \
    UnvalidatedField
from utils.functions import update_date_time_format


class SubmitFormDataSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()

    class Meta:
        model = FormData
        fields = ['name', 'geo', 'administration']


class SubmitFormDataAnswerSerializer(serializers.ModelSerializer):
    value = UnvalidatedField(allow_null=False)

    def validate_value(self, value):
        if value == '':
            raise ValidationError('Value is required')
        if isinstance(value, list) and len(value) == 0:
            raise ValidationError('Value is required')
        return value

    def validate(self, attrs):
        if not isinstance(attrs.get('value'), list) and attrs.get(
                'question').type in [QuestionTypes.geo,
                                     QuestionTypes.option,
                                     QuestionTypes.multiple_option]:
            raise ValidationError(
                {'value': 'Valid list value is required'})
        elif not isinstance(attrs.get('value'), str) and attrs.get(
                'question').type in [QuestionTypes.text,
                                     QuestionTypes.photo,
                                     QuestionTypes.date]:

            raise ValidationError(
                {'value': 'Valid string value is required'})

        elif not isinstance(attrs.get('value'), int) and attrs.get(
                'question').type in [QuestionTypes.number,
                                     QuestionTypes.administration]:
            raise ValidationError(
                {'value': 'Valid number value is required'})

        return attrs

    class Meta:
        model = Answers
        fields = ['question', 'value']


class SubmitFormSerializer(serializers.Serializer):
    data = SubmitFormDataSerializer()
    answer = SubmitFormDataAnswerSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        data = validated_data.get('data')
        data['form'] = self.context.get('form')
        data['created_by'] = self.context.get('user')
        data['updated_by'] = self.context.get('user')
        obj_data = self.fields.get('data').create(data)

        """
        Answer value based on Question type
        -geo = 1 #option
        -administration = 2 #value
        -text = 3 #name
        -number = 4 #value
        -option = 5 #option
        -multiple_option = 6 #option
        -cascade = 7 #option
        -photo = 8 #name
        -date = 9 #name
        """

        for answer in validated_data.get('answer'):
            name = None
            value = None
            option = None

            if answer.get('question').type in [QuestionTypes.geo,
                                               QuestionTypes.option,
                                               QuestionTypes.multiple_option]:
                option = answer.get('value')
            elif answer.get('question').type in [QuestionTypes.text,
                                                 QuestionTypes.photo,
                                                 QuestionTypes.date]:
                name = answer.get('value')
            else:
                # for administration,number question type
                value = answer.get('value')

            Answers.objects.create(
                data=obj_data,
                question=answer.get('question'),
                name=name,
                value=value,
                options=option,
                created_by=self.context.get('user'),
            )
        return object


class ListDataAnswerSerializer(serializers.ModelSerializer):
    history = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    def get_history(self, instance):
        return False

    def get_value(self, instance: Answers):
        if instance.question.type in [QuestionTypes.geo, QuestionTypes.option,
                                      QuestionTypes.multiple_option]:
            return instance.options
        elif instance.question.type in [QuestionTypes.administration,
                                        QuestionTypes.number]:
            return instance.value
        else:
            return instance.name

    class Meta:
        model = Answers
        fields = ['history', 'question', 'value']


class ListFormDataSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()
    answer = serializers.SerializerMethodField()

    def get_created_by(self, instance: FormData):
        return instance.created_by.get_full_name()

    def get_updated_by(self, instance: FormData):
        if instance.updated_by:
            return instance.updated_by.get_full_name()
        return None

    def get_created(self, instance: FormData):
        return update_date_time_format(instance.created)

    def get_updated(self, instance: FormData):
        return update_date_time_format(instance.updated)

    @extend_schema_field(ListDataAnswerSerializer(many=True))
    def get_answer(self, instance: FormData):
        return ListDataAnswerSerializer(instance=instance.data_answer.all(),
                                        many=True).data

    class Meta:
        model = FormData
        fields = ['id', 'name', 'form', 'administration', 'geo', 'created_by',
                  'updated_by', 'created', 'updated', 'answer']
